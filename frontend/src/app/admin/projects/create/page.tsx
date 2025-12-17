'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useWalletUi } from '@wallet-ui/react';
import { createProjectFromForm, fundProject, activateProject } from '@/lib/w3swapClient';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { RequireAdmin } from '@/components/auth/require-admin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle,
  Coins,
  Shield,
  TrendingUp,
  X,
  FileText
} from 'lucide-react';
import { BN } from '@coral-xyz/anchor';

interface ProjectConfig {
  name: string;
  description: string;
  oldToken: {
    address: string;
    symbol: string;
    decimals: number;
    isToken2022: boolean;
  };
  newToken: {
    address: string;
    symbol: string;
    decimals: number;
    isToken2022: boolean;
  };
  migrationRate: {
    oldAmount: number;
    newAmount: number;
  };
  startDate: string;
  endDate: string;
  lpConfig: {
    commitment: number;
    lockDuration: number;
    initialPrice: number;
    binStep: number;
    minBinId: number;
    maxBinId: number;
  };
  allowList: string[];
  denyList: string[];
  requiresKYC: boolean;
  specialRatios: Array<{
    address: string;
    oldAmount: number;
    newAmount: number;
  }>;
}

export default function CreateProjectPage() {
  const router = useRouter();
  const { account, wallet, connected } = useWalletUi();
  const [activeTab, setActiveTab] = useState('basic');
  const [isCreating, setIsCreating] = useState(false);
  const [createdProjectId, setCreatedProjectId] = useState<number | null>(null);
  const [fundAmount, setFundAmount] = useState<number>(0);
  const [activateParams, setActivateParams] = useState({
    meteoraPool: '',
    lpMint: '',
    tokenAllocation: '', // base units
    initialPrice: '0.001',
    binStep: 20,
    baseFee: 25,
    priceRangeMin: '0.0005',
    priceRangeMax: '0.002',
  });

  const [config, setConfig] = useState<ProjectConfig>({
    name: '',
    description: '',
    oldToken: {
      address: '',
      symbol: '',
      decimals: 9,
      isToken2022: false,
    },
    newToken: {
      address: '',
      symbol: '',
      decimals: 9,
      isToken2022: false,
    },
    migrationRate: {
      oldAmount: 1,
      newAmount: 1,
    },
    startDate: '',
    endDate: '',
    lpConfig: {
      commitment: 0,
      lockDuration: 60,
      initialPrice: 1,
      binStep: 100,
      minBinId: -1000,
      maxBinId: 1000,
    },
    allowList: [],
    denyList: [],
    requiresKYC: false,
    specialRatios: [],
  });

  const [newAllowAddress, setNewAllowAddress] = useState('');
  const [newDenyAddress, setNewDenyAddress] = useState('');
  const [newSpecialRatio, setNewSpecialRatio] = useState({
    address: '',
    oldAmount: 1,
    newAmount: 1,
  });

  // Validation functions for each tab
  const validateBasicTab = (): boolean => {
    return !!config.name.trim();
  };

  const validateTokensTab = (): boolean => {
    return !!(config.oldToken.address.trim() && config.newToken.address.trim());
  };

  const validateNotTheSameToken = (): boolean => {
    return config.oldToken.address !== config.newToken.address;
  };

  const validateMigrationTab = (): boolean => {
    return !!(config.startDate && config.endDate);
  };

  const validateLiquidityTab = (): boolean => {
    return !!(
      config.lpConfig.commitment > 0 &&
      config.lpConfig.lockDuration > 0 &&
      config.lpConfig.initialPrice > 0 &&
      config.lpConfig.binStep > 0 &&
      config.lpConfig.minBinId !== undefined &&
      config.lpConfig.maxBinId !== undefined
    );
  };

  const isTabValid = (tab: string): boolean => {
    switch (tab) {
      case 'basic':
        return validateBasicTab();
      case 'tokens':
        return validateTokensTab();
      case 'migration':
        return validateMigrationTab();
      case 'liquidity':
        return validateLiquidityTab();
      case 'access':
        return true; // Access tab doesn't have required fields
      default:
        return false;
    }
  };

  const canAccessTab = (tab: string | undefined): boolean => {
    if (!tab) return false;
    const tabs = ['basic', 'tokens', 'migration', 'liquidity', 'access'];
    const targetIndex = tabs.indexOf(tab);
    if (targetIndex === -1) return false;

    // Can always go to previous tabs
    const currentIndex = tabs.indexOf(activeTab);
    if (targetIndex <= currentIndex) return true;

    // For future tabs, check if all previous tabs are valid
    for (let i = 0; i < targetIndex; i++) {
      const tab = tabs[i];
      if (tab && !isTabValid(tab)) {
        return false;
      }
    }
    return true;
  };

  const handleTabChange = (newTab: string | undefined) => {
    if (newTab && canAccessTab(newTab)) {
      setActiveTab(newTab);
    } else if (newTab) {
      toast.error('Please complete all required fields in previous tabs before proceeding');
    }
  };

  const handleNext = () => {
    if (!isTabValid(activeTab)) {
      toast.error('Please complete all required fields before proceeding');
      return;
    }

    const tabs = ['basic', 'tokens', 'migration', 'liquidity', 'access'];
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex < tabs.length - 1) {
      const nextTab = tabs[currentIndex + 1];
      if (nextTab && canAccessTab(nextTab)) {
        setActiveTab(nextTab);
      } else {
        toast.error('Please complete all required fields before proceeding');
      }
    }
  };

  const handlePrevious = () => {
    const tabs = ['basic', 'tokens', 'migration', 'liquidity', 'access'];
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex > 0) {
      const prevTab = tabs[currentIndex - 1];
      if (prevTab) {
        setActiveTab(prevTab);
      }
    }
  };

  const handleCreateProject = async () => {
    setIsCreating(true);
    try {
      if (!connected || !account || !wallet) throw new Error('Connect wallet');



      // getProject of current log in user
      // Check for the highest projectID
      // Increase it by 1 that will be the new projectID

      const projectId = Math.floor(Date.now() / 1000);
      const response = await createProjectFromForm(account, wallet, {
        projectId,
        name: config.name,
        oldTokenMint: config.oldToken.address,
        oldIsToken2022: !!config.oldToken.isToken2022,
        newTokenMint: config.newToken.address,
        newIsToken2022: !!config.newToken.isToken2022,
        startTime: config.startDate ? Math.floor(new Date(config.startDate).getTime() / 1000) : undefined,
        endTime: config.endDate ? Math.floor(new Date(config.endDate).getTime() / 1000) : undefined,
        exchangeOld: config.migrationRate.oldAmount || 0,
        exchangeNew: config.migrationRate.newAmount || 0,
        solCommitment: config.lpConfig.commitment || 0,
        allowList: config.allowList,
        denyList: config.denyList,
        specialRatios: config.specialRatios,
      });

      // await createProjectVaults(account, wallet, projectId);
      setCreatedProjectId(projectId);
      toast.success('Project created and vaults initialized');
    } catch (e) {
      console.error(e);
      toast.error((e as Error).message || 'Failed to create project');
    } finally {
      setIsCreating(false);
    }
  };

  const handleFundProject = async () => {
    if (!connected || !account || !wallet || createdProjectId == null) return;
    try {
      await fundProject(account, wallet, createdProjectId, fundAmount);
      toast.success('Project funded');
    } catch (e) {
      console.error(e);
      toast.error((e as Error).message || 'Failed to fund project');
    }
  };

  const handleActivateProject = async () => {
    if (!connected || !account || !wallet || createdProjectId == null) return;
    try {
      await activateProject(account, wallet, new BN(createdProjectId));
      toast.success('Project activated');
      router.push(`/admin/projects/${createdProjectId}`);
    } catch (e) {
      console.error(e);
      toast.error((e as Error).message || 'Failed to activate project');
    }
  };

  return (
    <RequireAdmin
      fallback={
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p className="text-slate-400">You must be an admin to access this section.</p>
          </div>
        </div>
      }
    >
      <div className="space-y-6 bg-black">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-cyan-500 via-purple-500 to-teal-500 bg-clip-text text-transparent">
            Create Migration Project
          </h1>
          <p className="mt-2 text-slate-400">
            Set up a new token migration project with liquidity protection
          </p>
        </motion.div>

        <div className="flex gap-6 items-start">
          {/* Sidebar Navigation */}
          <div className="w-72 shrink-0">
            <div className="sticky top-0 rounded-lg glass-card border border-slate-800 p-2 backdrop-blur-sm shadow-lg flex flex-col">
              <div className="space-y-1">
                {[
                  { id: 'basic', label: 'Basic Info', icon: FileText },
                  { id: 'tokens', label: 'Tokens', icon: Coins },
                  { id: 'migration', label: 'Migration', icon: ArrowRight },
                  { id: 'liquidity', label: 'Liquidity', icon: TrendingUp },
                  { id: 'access', label: 'Access', icon: Shield },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  const canAccess = canAccessTab(tab.id);
                  const isValid = isTabValid(tab.id);

                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      disabled={!canAccess && activeTab !== tab.id}
                      className={cn(
                        'w-full flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all',
                        'disabled:cursor-not-allowed disabled:opacity-50',
                        isActive
                          ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-400 border border-cyan-500/40 shadow-lg shadow-cyan-500/20'
                          : 'text-slate-400 hover:bg-slate-900/50 hover:text-white',
                        !isValid && isActive && 'ring-2 ring-yellow-500/50',
                        !canAccess && activeTab !== tab.id && 'opacity-40'
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1 text-left">{tab.label}</span>
                      {!isValid && activeTab !== tab.id && (
                        <span className="text-yellow-400 text-xs">*</span>
                      )}
                      {isActive && (
                        <div className="h-2 w-2 rounded-full bg-cyan-400" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-800 flex gap-2">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={activeTab === 'basic'}
                  size="sm"
                  className="flex-1 border-slate-700 hover:border-cyan-500"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>

                {activeTab === 'access' ? (
                  <Button
                    onClick={handleCreateProject}
                    disabled={!config.name || !config.oldToken.address || !config.newToken.address || isCreating || !connected || !validateNotTheSameToken()}
                    size="sm"
                    className="flex-1 btn-brand"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Create Project
                      </>
                    )}
                  </Button>
                ) : (
                  <Button onClick={handleNext} size="sm" className="flex-1 btn-brand">
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0 ml-0">
            {/* Basic Info */}
            {activeTab === 'basic' && (
              <Card className="glass-card h-[300px] flex flex-col pt-4 pb-4">
                <CardHeader className="pb-2 pt-0 shrink-0">
                  <CardTitle className="text-base text-white">Project Information</CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    Basic details about your migration project
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col space-y-2 min-h-0 overflow-hidden pb-0">
                  <div className="shrink-0">
                    <Label htmlFor="name" className="text-sm text-white">
                      Project Name <span className="text-yellow-400">*</span>
                    </Label>
                    <Input
                      id="name"
                      placeholder="e.g., DeFi Token V2 Migration"
                      value={config.name}
                      onChange={(e) => setConfig({ ...config, name: e.target.value })}
                      className={cn(
                        "mt-1 h-9 text-sm bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500",
                        !config.name.trim() && "border-yellow-500/50 focus-visible:ring-yellow-500"
                      )}
                      required
                    />
                    {!config.name.trim() && (
                      <p className="text-xs text-yellow-400 mt-0.5">Project name is required</p>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col min-h-0">
                    <Label htmlFor="description" className="text-sm text-white">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe the purpose and benefits of this migration..."
                      value={config.description}
                      onChange={(e) => setConfig({ ...config, description: e.target.value })}
                      className="mt-1 flex-1 resize-none text-sm min-h-0 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Token Configuration */}
            {activeTab === 'tokens' && (
              <div className="grid gap-4 lg:grid-cols-2">
                <Card className="glass-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-white">Old Token</CardTitle>
                    <CardDescription className="text-xs text-slate-400">
                      The existing token that users will migrate from
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label htmlFor="oldAddress" className="text-sm text-white">
                        Token Address <span className="text-yellow-400">*</span>
                      </Label>
                      <Input
                        id="oldAddress"
                        placeholder="So11111111111111111111111111111111111111112"
                        value={config.oldToken.address}
                        onChange={(e) => setConfig({
                          ...config,
                          oldToken: { ...config.oldToken, address: e.target.value }
                        })}
                        className={cn(
                          "mt-1 text-sm h-9 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500",
                          !config.oldToken.address.trim() && "border-yellow-500/50 focus-visible:ring-yellow-500"
                        )}
                        required
                      />
                      {!config.oldToken.address.trim() && (
                        <p className="text-xs text-yellow-400 mt-0.5">Old token address is required</p>
                      )}
                    </div>

                    <div className="grid gap-3 grid-cols-2">
                      <div>
                        <Label htmlFor="oldSymbol" className="text-sm text-white">Symbol</Label>
                        <Input
                          id="oldSymbol"
                          placeholder="OLD"
                          value={config.oldToken.symbol}
                          onChange={(e) => setConfig({
                            ...config,
                            oldToken: { ...config.oldToken, symbol: e.target.value.toUpperCase() }
                          })}
                          className="mt-1 text-sm h-9 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500"
                        />
                      </div>

                      <div>
                        <Label htmlFor="oldDecimals" className="text-sm text-white">Decimals</Label>
                        <Input
                          id="oldDecimals"
                          type="number"
                          min="0"
                          max="9"
                          value={config.oldToken.decimals}
                          onChange={(e) => setConfig({
                            ...config,
                            oldToken: { ...config.oldToken, decimals: parseInt(e.target.value) || 0 }
                          })}
                          className="mt-1 text-sm h-9 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <div className="space-y-0">
                        <Label htmlFor="oldIsToken2022" className="text-sm text-white">Token-2022</Label>
                        <p className="text-xs text-slate-400">
                          Token Extensions token?
                        </p>
                      </div>
                      <Switch
                        id="oldIsToken2022"
                        checked={config.oldToken.isToken2022}
                        onCheckedChange={(checked) => setConfig({
                          ...config,
                          oldToken: { ...config.oldToken, isToken2022: checked }
                        })}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-white">New Token</CardTitle>
                    <CardDescription className="text-xs text-slate-400">
                      The new token that users will receive
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label htmlFor="newAddress" className="text-sm text-white">
                        Token Address <span className="text-yellow-400">*</span>
                      </Label>
                      <Input
                        id="newAddress"
                        placeholder="So11111111111111111111111111111111111111113"
                        value={config.newToken.address}
                        onChange={(e) => setConfig({
                          ...config,
                          newToken: { ...config.newToken, address: e.target.value }
                        })}
                        className={cn(
                          "mt-1 text-sm h-9 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500",
                          !config.newToken.address.trim() && "border-yellow-500/50 focus-visible:ring-yellow-500"
                        )}
                        required
                      />
                      {!config.newToken.address.trim() && (
                        <p className="text-xs text-yellow-400 mt-0.5">New token address is required</p>
                      )}
                    </div>

                    <div className="grid gap-3 grid-cols-2">
                      <div>
                        <Label htmlFor="newSymbol" className="text-sm text-white">Symbol</Label>
                        <Input
                          id="newSymbol"
                          placeholder="NEW"
                          value={config.newToken.symbol}
                          onChange={(e) => setConfig({
                            ...config,
                            newToken: { ...config.newToken, symbol: e.target.value.toUpperCase() }
                          })}
                          className="mt-1 text-sm h-9 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500"
                        />
                      </div>

                      <div>
                        <Label htmlFor="newDecimals" className="text-sm text-white">Decimals</Label>
                        <Input
                          id="newDecimals"
                          type="number"
                          min="0"
                          max="9"
                          value={config.newToken.decimals}
                          onChange={(e) => setConfig({
                            ...config,
                            newToken: { ...config.newToken, decimals: parseInt(e.target.value) || 0 }
                          })}
                          className="mt-1 text-sm h-9 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="space-y-0">
                        <Label htmlFor="isToken2022" className="text-sm text-white">Token-2022</Label>
                        <p className="text-xs text-slate-400">
                          Token Extensions token?
                        </p>
                      </div>
                      <Switch
                        id="isToken2022"
                        checked={config.newToken.isToken2022}
                        onCheckedChange={(checked) => setConfig({
                          ...config,
                          newToken: { ...config.newToken, isToken2022: checked }
                        })}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Migration Settings */}
            {activeTab === 'migration' && (
              <div className="space-y-6">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="text-white">Migration Configuration</CardTitle>
                    <CardDescription className="text-slate-400">
                      Set the exchange rate and migration period
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-white">Exchange Rate</Label>
                      <div className="mt-1 flex items-center gap-2">
                        <Input
                          type="number"
                          min="1"
                          placeholder="1"
                          value={config.migrationRate.oldAmount}
                          onChange={(e) => setConfig({
                            ...config,
                            migrationRate: { ...config.migrationRate, oldAmount: parseInt(e.target.value) || 1 }
                          })}
                          className="w-24 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500"
                        />
                        <span className="text-slate-400">{config.oldToken.symbol || 'OLD'}</span>
                        <ArrowRight className="h-4 w-4 text-slate-400" />
                        <Input
                          type="number"
                          min="1"
                          placeholder="1"
                          value={config.migrationRate.newAmount}
                          onChange={(e) => setConfig({
                            ...config,
                            migrationRate: { ...config.migrationRate, newAmount: parseInt(e.target.value) || 1 }
                          })}
                          className="w-24 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500"
                        />
                        <span className="text-slate-400">{config.newToken.symbol || 'NEW'}</span>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="startDate" className="text-white">
                          Start Date <span className="text-yellow-400">*</span>
                        </Label>
                        <Input
                          id="startDate"
                          type="datetime-local"
                          value={config.startDate}
                          onChange={(e) => setConfig({ ...config, startDate: e.target.value })}
                          className={cn(
                            "mt-1 bg-slate-900/50 border-slate-700 text-white focus:border-cyan-500",
                            !config.startDate && "border-yellow-500/50 focus-visible:ring-yellow-500"
                          )}
                          required
                        />
                        {!config.startDate && (
                          <p className="text-xs text-yellow-400 mt-1">Start date is required</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="endDate" className="text-white">
                          End Date <span className="text-yellow-400">*</span>
                        </Label>
                        <Input
                          id="endDate"
                          type="datetime-local"
                          value={config.endDate}
                          onChange={(e) => setConfig({ ...config, endDate: e.target.value })}
                          className={cn(
                            "mt-1 bg-slate-900/50 border-slate-700 text-white focus:border-cyan-500",
                            !config.endDate && "border-yellow-500/50 focus-visible:ring-yellow-500"
                          )}
                          required
                        />
                        {!config.endDate && (
                          <p className="text-xs text-yellow-400 mt-1">End date is required</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Liquidity Configuration */}
            {activeTab === 'liquidity' && (
              <Card className="glass-card pt-3 pb-3">
                <CardHeader className="pb-2 pt-0">
                  <CardTitle className="text-base text-white">Liquidity Pool Configuration</CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    Configure the initial liquidity pool parameters
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Alert className="bg-cyan-500/10 border-cyan-500/30 py-1.5 px-2 w-full">
                    <TrendingUp className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                    <AlertDescription className="text-xs text-cyan-300 leading-tight">
                      <strong>Note:</strong> Liquidity pool will be created automatically using Meteora DLMM when the project is activated. The SOL commitment will be used to provide initial liquidity.
                    </AlertDescription>
                  </Alert>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <div>
                      <Label htmlFor="commitment" className="text-xs text-white">
                        SOL Commitment <span className="text-yellow-400">*</span>
                      </Label>
                      <Input
                        id="commitment"
                        type="number"
                        min="0"
                        step="0.1"
                        placeholder="10"
                        value={config.lpConfig.commitment}
                        onChange={(e) => setConfig({
                          ...config,
                          lpConfig: { ...config.lpConfig, commitment: Number(e.target.value) }
                        })}
                        className={cn(
                          "mt-0.5 h-8 text-sm bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500",
                          !config.lpConfig.commitment && "border-yellow-500/50 focus-visible:ring-yellow-500"
                        )}
                        required
                      />
                      {!config.lpConfig.commitment && (
                        <p className="text-xs text-yellow-400 mt-0.5 leading-tight">SOL commitment is required</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="lockDuration" className="text-xs text-white">
                        LP Lock Duration (days) <span className="text-yellow-400">*</span>
                      </Label>
                      <Input
                        id="lockDuration"
                        type="number"
                        min="1"
                        value={config.lpConfig.lockDuration}
                        onChange={(e) => setConfig({
                          ...config,
                          lpConfig: { ...config.lpConfig, lockDuration: parseInt(e.target.value) || 60 }
                        })}
                        className={cn(
                          "mt-0.5 h-8 text-sm bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500",
                          !config.lpConfig.lockDuration && "border-yellow-500/50 focus-visible:ring-yellow-500"
                        )}
                        required
                      />
                      {!config.lpConfig.lockDuration && (
                        <p className="text-xs text-yellow-400 mt-0.5 leading-tight">Lock duration is required</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="initialPrice" className="text-xs text-white">
                        Initial Price (NEW/SOL) <span className="text-yellow-400">*</span>
                      </Label>
                      <Input
                        id="initialPrice"
                        type="number"
                        min="0"
                        step="0.0001"
                        placeholder="0.001"
                        value={config.lpConfig.initialPrice}
                        onChange={(e) => setConfig({
                          ...config,
                          lpConfig: { ...config.lpConfig, initialPrice: Number(e.target.value) }
                        })}
                        className={cn(
                          "mt-0.5 h-8 text-sm bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500",
                          !config.lpConfig.initialPrice && "border-yellow-500/50 focus-visible:ring-yellow-500"
                        )}
                        required
                      />
                      {!config.lpConfig.initialPrice && (
                        <p className="text-xs text-yellow-400 mt-0.5 leading-tight">Initial price is required</p>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-3">
                    <div>
                      <Label htmlFor="binStep" className="text-xs text-white">
                        Bin Step <span className="text-yellow-400">*</span>
                      </Label>
                      <Input
                        id="binStep"
                        type="number"
                        min="1"
                        value={config.lpConfig.binStep}
                        onChange={(e) => setConfig({
                          ...config,
                          lpConfig: { ...config.lpConfig, binStep: parseInt(e.target.value) || 100 }
                        })}
                        className={cn(
                          "mt-0.5 h-8 text-sm bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500",
                          !config.lpConfig.binStep && "border-yellow-500/50 focus-visible:ring-yellow-500"
                        )}
                        required
                      />
                      {!config.lpConfig.binStep && (
                        <p className="text-xs text-yellow-400 mt-0.5 leading-tight">Bin step is required</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="minBinId" className="text-xs text-white">
                        Min Bin ID <span className="text-yellow-400">*</span>
                      </Label>
                      <Input
                        id="minBinId"
                        type="number"
                        value={config.lpConfig.minBinId}
                        onChange={(e) => setConfig({
                          ...config,
                          lpConfig: { ...config.lpConfig, minBinId: parseInt(e.target.value) || -1000 }
                        })}
                        className={cn(
                          "mt-0.5 h-8 text-sm bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500",
                          config.lpConfig.minBinId === undefined && "border-yellow-500/50 focus-visible:ring-yellow-500"
                        )}
                        required
                      />
                      {config.lpConfig.minBinId === undefined && (
                        <p className="text-xs text-yellow-400 mt-0.5 leading-tight">Min bin ID is required</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="maxBinId" className="text-xs text-white">
                        Max Bin ID <span className="text-yellow-400">*</span>
                      </Label>
                      <Input
                        id="maxBinId"
                        type="number"
                        value={config.lpConfig.maxBinId}
                        onChange={(e) => setConfig({
                          ...config,
                          lpConfig: { ...config.lpConfig, maxBinId: parseInt(e.target.value) || 1000 }
                        })}
                        className={cn(
                          "mt-0.5 h-8 text-sm bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500",
                          config.lpConfig.maxBinId === undefined && "border-yellow-500/50 focus-visible:ring-yellow-500"
                        )}
                        required
                      />
                      {config.lpConfig.maxBinId === undefined && (
                        <p className="text-xs text-yellow-400 mt-0.5 leading-tight">Max bin ID is required</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Access Control */}
            {activeTab === 'access' && (
              <div className="grid gap-3 lg:grid-cols-2">
                <Card className="glass-card pt-3 pb-3">
                  <CardHeader className="pb-2 pt-0">
                    <CardTitle className="text-base text-white">Access Control</CardTitle>
                    <CardDescription className="text-xs text-slate-400">
                      Configure who can participate in the migration
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="space-y-0">
                        <Label htmlFor="kyc" className="text-xs text-white">Require KYC</Label>
                        <p className="text-xs text-slate-400 leading-tight">
                          Require users to complete KYC before migrating
                        </p>
                      </div>
                      <Switch
                        id="kyc"
                        checked={config.requiresKYC}
                        onCheckedChange={(checked) => setConfig({ ...config, requiresKYC: checked })}
                      />
                    </div>

                    <div>
                      <Label className="text-xs text-white">Allow List (Optional)</Label>
                      <p className="text-xs text-slate-400 mb-1.5 leading-tight">
                        Only these addresses can participate
                      </p>

                      {config.allowList.length > 0 && (
                        <div className="mb-1.5 space-y-1">
                          {config.allowList.map((address, index) => (
                            <div key={index} className="flex items-center gap-1.5">
                              <span className="flex-1 text-xs font-mono bg-slate-900/50 rounded px-2 py-0.5 truncate text-slate-300">
                                {address}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => setConfig({
                                  ...config,
                                  allowList: config.allowList.filter((_, i) => i !== index)
                                })}
                              >
                                <X className="h-3 w-3 text-slate-400" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-1.5">
                        <Input
                          placeholder="Wallet address"
                          value={newAllowAddress}
                          onChange={(e) => setNewAllowAddress(e.target.value)}
                          className="flex-1 h-8 text-sm bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 border-slate-700 hover:border-cyan-500"
                          onClick={() => {
                            if (newAllowAddress) {
                              setConfig({
                                ...config,
                                allowList: [...config.allowList, newAllowAddress]
                              });
                              setNewAllowAddress('');
                            }
                          }}
                        >
                          Add
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs text-white">Deny List (Optional)</Label>
                      <p className="text-xs text-slate-400 mb-1.5 leading-tight">
                        These addresses cannot participate
                      </p>

                      {config.denyList.length > 0 && (
                        <div className="mb-1.5 space-y-1">
                          {config.denyList.map((address, index) => (
                            <div key={index} className="flex items-center gap-1.5">
                              <span className="flex-1 text-xs font-mono bg-slate-900/50 rounded px-2 py-0.5 truncate text-slate-300">
                                {address}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => setConfig({
                                  ...config,
                                  denyList: config.denyList.filter((_, i) => i !== index)
                                })}
                              >
                                <X className="h-3 w-3 text-slate-400" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-1.5">
                        <Input
                          placeholder="Wallet address"
                          value={newDenyAddress}
                          onChange={(e) => setNewDenyAddress(e.target.value)}
                          className="flex-1 h-8 text-sm bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 border-slate-700 hover:border-cyan-500"
                          onClick={() => {
                            if (newDenyAddress) {
                              setConfig({
                                ...config,
                                denyList: [...config.denyList, newDenyAddress]
                              });
                              setNewDenyAddress('');
                            }
                          }}
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card pt-3 pb-3">
                  <CardHeader className="pb-2 pt-0">
                    <CardTitle className="text-base text-white">Special Exchange Rates</CardTitle>
                    <CardDescription className="text-xs text-slate-400">
                      Set custom exchange rates for specific addresses
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {config.specialRatios.length > 0 && (
                      <div className="mb-2 space-y-1">
                        {config.specialRatios.map((ratio, index) => (
                          <div key={index} className="flex items-center gap-1.5 text-xs">
                            <span className="flex-1 font-mono bg-slate-900/50 rounded px-2 py-0.5 truncate text-slate-300">
                              {ratio.address}
                            </span>
                            <span className="text-slate-400 shrink-0">
                              {ratio.oldAmount}:{ratio.newAmount}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 shrink-0"
                              onClick={() => setConfig({
                                ...config,
                                specialRatios: config.specialRatios.filter((_, i) => i !== index)
                              })}
                            >
                              <X className="h-3 w-3 text-slate-400" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <Input
                        placeholder="Wallet address"
                        value={newSpecialRatio.address}
                        onChange={(e) => setNewSpecialRatio({ ...newSpecialRatio, address: e.target.value })}
                        className="h-8 text-sm bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500"
                      />
                      <div className="flex items-center gap-1.5">
                        <Input
                          type="number"
                          min="1"
                          placeholder="1"
                          value={newSpecialRatio.oldAmount}
                          onChange={(e) => setNewSpecialRatio({
                            ...newSpecialRatio,
                            oldAmount: parseInt(e.target.value) || 1
                          })}
                          className="w-20 h-8 text-sm bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500"
                        />
                        <span className="text-xs text-slate-400">{config.oldToken.symbol || 'OLD'}</span>
                        <ArrowRight className="h-3 w-3 text-slate-400" />
                        <Input
                          type="number"
                          min="1"
                          placeholder="2"
                          value={newSpecialRatio.newAmount}
                          onChange={(e) => setNewSpecialRatio({
                            ...newSpecialRatio,
                            newAmount: parseInt(e.target.value) || 1
                          })}
                          className="w-20 h-8 text-sm bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500"
                        />
                        <span className="text-xs text-slate-400">{config.newToken.symbol || 'NEW'}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 border-slate-700 hover:border-cyan-500"
                          onClick={() => {
                            if (newSpecialRatio.address) {
                              setConfig({
                                ...config,
                                specialRatios: [...config.specialRatios, newSpecialRatio]
                              });
                              setNewSpecialRatio({ address: '', oldAmount: 1, newAmount: 1 });
                            }
                          }}
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>

        {/* Post-Create Actions */}
        {createdProjectId !== null && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto space-y-6 mt-6"
          >
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-white">Post-Create Actions</CardTitle>
                <CardDescription className="text-slate-400">Fund with new tokens and activate the project</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-white">Fund Amount (new token base units)</Label>
                  <div className="flex gap-2">
                    <Input
                      value={fundAmount}
                      onChange={(e) => setFundAmount(Number(e.target.value))}
                      placeholder="100000000000"
                      className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500"
                    />
                    <Button variant="outline" onClick={handleFundProject} className="border-slate-700 hover:border-cyan-500">
                      Fund Project
                    </Button>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">Meteora Pool Address</Label>
                    <Input
                      value={activateParams.meteoraPool}
                      onChange={(e) => setActivateParams({ ...activateParams, meteoraPool: e.target.value })}
                      className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <Label className="text-white">LP Mint Address</Label>
                    <Input
                      value={activateParams.lpMint}
                      onChange={(e) => setActivateParams({ ...activateParams, lpMint: e.target.value })}
                      className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Token Allocation (base units)</Label>
                    <Input
                      value={activateParams.tokenAllocation}
                      onChange={(e) => setActivateParams({ ...activateParams, tokenAllocation: e.target.value })}
                      className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Initial Price (SOL per token)</Label>
                    <Input
                      value={activateParams.initialPrice}
                      onChange={(e) => setActivateParams({ ...activateParams, initialPrice: e.target.value })}
                      className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Bin Step</Label>
                    <Input
                      type="number"
                      value={activateParams.binStep}
                      onChange={(e) => setActivateParams({ ...activateParams, binStep: parseInt(e.target.value) || 0 })}
                      className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Base Fee (bps)</Label>
                    <Input
                      type="number"
                      value={activateParams.baseFee}
                      onChange={(e) => setActivateParams({ ...activateParams, baseFee: parseInt(e.target.value) || 0 })}
                      className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Price Range Min (SOL)</Label>
                    <Input
                      value={activateParams.priceRangeMin}
                      onChange={(e) => setActivateParams({ ...activateParams, priceRangeMin: e.target.value })}
                      className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Price Range Max (SOL)</Label>
                    <Input
                      value={activateParams.priceRangeMax}
                      onChange={(e) => setActivateParams({ ...activateParams, priceRangeMax: e.target.value })}
                      className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleActivateProject} className="btn-brand">
                    Activate Project
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </RequireAdmin>
  );
}
