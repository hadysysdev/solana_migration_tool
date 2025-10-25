'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnchorProvider, BN } from '@coral-xyz/anchor';
import { useAnchorWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { getConnection } from '@/lib/anchor';
import { createProjectInitFromForm, createProjectVaults, fundProject as fundProjectIx, activateProject as activateProjectIx } from '@/lib/w3swapClient';
import { toast } from 'sonner';
import { RequireAdmin } from '@/components/auth/require-admin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Info,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle,
  Coins,
  Users,
  Settings,
  Shield,
  TrendingUp,
  Calendar,
  Plus,
  X
} from 'lucide-react';

interface ProjectConfig {
  // Basic Info
  name: string;
  description: string;
  
  // Token Configuration
  oldToken: {
    address: string;
    symbol: string;
    decimals: number;
  };
  newToken: {
    address: string;
    symbol: string;
    decimals: number;
    isToken2022: boolean;
  };
  
  // Migration Settings
  migrationRate: {
    oldAmount: number;
    newAmount: number;
  };
  startDate: string;
  endDate: string;
  
  // LP Configuration
  lpConfig: {
    commitment: string; // SOL amount
    lockDuration: number; // days
    initialPrice: string;
    binStep: number;
    minBinId: number;
    maxBinId: number;
  };
  
  // Access Control
  allowList: string[];
  denyList: string[];
  requiresKYC: boolean;
  
  // Special Ratios
  specialRatios: Array<{
    address: string;
    oldAmount: number;
    newAmount: number;
  }>;
}

export default function CreateProjectPage() {
  const router = useRouter();
  const wallet = useAnchorWallet();
  const [activeTab, setActiveTab] = useState('basic');
  const [isCreating, setIsCreating] = useState(false);
  const [createdProjectId, setCreatedProjectId] = useState<number | null>(null);
  const [fundAmount, setFundAmount] = useState<string>(''); // base units of new token
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
      commitment: '',
      lockDuration: 90,
      initialPrice: '1',
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

  const handleNext = () => {
    const tabs = ['basic', 'tokens', 'migration', 'liquidity', 'access'];
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1]);
    }
  };

  const handlePrevious = () => {
    const tabs = ['basic', 'tokens', 'migration', 'liquidity', 'access'];
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1]);
    }
  };

  const handleCreateProject = async () => {
    setIsCreating(true);
    try {
      if (!wallet || !wallet.publicKey) throw new Error('Connect wallet');
      const connection = getConnection();
      const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });

      const projectId = Math.floor(Date.now() / 1000);
      await createProjectInitFromForm(provider, {
        projectId,
        name: config.name,
        oldTokenMint: config.oldToken.address,
        newTokenMint: config.newToken.address,
        newIsToken2022: !!config.newToken.isToken2022,
        startTime: config.startDate ? Math.floor(new Date(config.startDate).getTime() / 1000) : undefined,
        endTime: config.endDate ? Math.floor(new Date(config.endDate).getTime() / 1000) : undefined,
        exchangeOld: config.migrationRate.oldAmount || 0,
        exchangeNew: config.migrationRate.newAmount || 0,
        solCommitment: config.lpConfig.commitment || '0',
        allowList: config.allowList,
        denyList: config.denyList,
        specialRatios: config.specialRatios,
      });

      await createProjectVaults(provider, projectId);
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
    if (!wallet || !wallet.publicKey || createdProjectId == null) return;
    const connection = getConnection();
    const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });
    try {
      await fundProjectIx(provider, createdProjectId, fundAmount);
      toast.success('Project funded');
    } catch (e) {
      console.error(e);
      toast.error((e as Error).message || 'Failed to fund project');
    }
  };

  const handleActivateProject = async () => {
    if (!wallet || !wallet.publicKey || createdProjectId == null) return;
    const connection = getConnection();
    const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });
    try {
      await activateProjectIx(provider, { projectId: createdProjectId, ...activateParams });
      toast.success('Project activated');
    } catch (e) {
      console.error(e);
      toast.error((e as Error).message || 'Failed to activate project');
    }
  };

  return (
    <RequireAdmin fallback={<div className="p-6">Admins only</div>}>
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Create Migration Project</h1>
        <p className="mt-2 text-foreground-muted">
          Set up a new token migration project with liquidity protection
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="tokens">Tokens</TabsTrigger>
          <TabsTrigger value="migration">Migration</TabsTrigger>
          <TabsTrigger value="liquidity">Liquidity</TabsTrigger>
          <TabsTrigger value="access">Access</TabsTrigger>
        </TabsList>

        {/* Basic Info */}
        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
              <CardDescription>
                Basic details about your migration project
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., DeFi Token V2 Migration"
                  value={config.name}
                  onChange={(e) => setConfig({ ...config, name: e.target.value })}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the purpose and benefits of this migration..."
                  value={config.description}
                  onChange={(e) => setConfig({ ...config, description: e.target.value })}
                  className="mt-1 h-32"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Token Configuration */}
        <TabsContent value="tokens" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Old Token</CardTitle>
              <CardDescription>
                The existing token that users will migrate from
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="oldAddress">Token Address</Label>
                <Input
                  id="oldAddress"
                  placeholder="So11111111111111111111111111111111111111112"
                  value={config.oldToken.address}
                  onChange={(e) => setConfig({ 
                    ...config, 
                    oldToken: { ...config.oldToken, address: e.target.value }
                  })}
                  className="mt-1"
                />
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="oldSymbol">Symbol</Label>
                  <Input
                    id="oldSymbol"
                    placeholder="OLD"
                    value={config.oldToken.symbol}
                    onChange={(e) => setConfig({ 
                      ...config, 
                      oldToken: { ...config.oldToken, symbol: e.target.value.toUpperCase() }
                    })}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="oldDecimals">Decimals</Label>
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
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>New Token</CardTitle>
              <CardDescription>
                The new token that users will receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="newAddress">Token Address</Label>
                <Input
                  id="newAddress"
                  placeholder="So11111111111111111111111111111111111111113"
                  value={config.newToken.address}
                  onChange={(e) => setConfig({ 
                    ...config, 
                    newToken: { ...config.newToken, address: e.target.value }
                  })}
                  className="mt-1"
                />
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="newSymbol">Symbol</Label>
                  <Input
                    id="newSymbol"
                    placeholder="NEW"
                    value={config.newToken.symbol}
                    onChange={(e) => setConfig({ 
                      ...config, 
                      newToken: { ...config.newToken, symbol: e.target.value.toUpperCase() }
                    })}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="newDecimals">Decimals</Label>
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
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="isToken2022">Token-2022</Label>
                  <p className="text-sm text-foreground-muted">
                    Is this a Token-2022 (Token Extensions) token?
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
        </TabsContent>

        {/* Migration Settings */}
        <TabsContent value="migration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Migration Configuration</CardTitle>
              <CardDescription>
                Set the exchange rate and migration period
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Exchange Rate</Label>
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
                    className="w-24"
                  />
                  <span className="text-foreground-muted">{config.oldToken.symbol || 'OLD'}</span>
                  <ArrowRight className="h-4 w-4 text-foreground-muted" />
                  <Input
                    type="number"
                    min="1"
                    placeholder="1"
                    value={config.migrationRate.newAmount}
                    onChange={(e) => setConfig({
                      ...config,
                      migrationRate: { ...config.migrationRate, newAmount: parseInt(e.target.value) || 1 }
                    })}
                    className="w-24"
                  />
                  <span className="text-foreground-muted">{config.newToken.symbol || 'NEW'}</span>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={config.startDate}
                    onChange={(e) => setConfig({ ...config, startDate: e.target.value })}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={config.endDate}
                    onChange={(e) => setConfig({ ...config, endDate: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Liquidity Configuration */}
        <TabsContent value="liquidity" className="space-y-6">
          <Alert>
            <TrendingUp className="h-4 w-4" />
            <AlertDescription>
              Liquidity pool will be created automatically using Meteora DLMM when the project is activated.
              The SOL commitment will be used to provide initial liquidity.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Liquidity Pool Configuration</CardTitle>
              <CardDescription>
                Configure the initial liquidity pool parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="commitment">SOL Commitment</Label>
                <Input
                  id="commitment"
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="100"
                  value={config.lpConfig.commitment}
                  onChange={(e) => setConfig({
                    ...config,
                    lpConfig: { ...config.lpConfig, commitment: e.target.value }
                  })}
                  className="mt-1"
                />
                <p className="text-xs text-foreground-muted mt-1">
                  Amount of SOL to commit for initial liquidity
                </p>
              </div>

              <div>
                <Label htmlFor="lockDuration">LP Lock Duration (days)</Label>
                <Input
                  id="lockDuration"
                  type="number"
                  min="1"
                  value={config.lpConfig.lockDuration}
                  onChange={(e) => setConfig({
                    ...config,
                    lpConfig: { ...config.lpConfig, lockDuration: parseInt(e.target.value) || 90 }
                  })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="initialPrice">Initial Price (NEW/SOL)</Label>
                <Input
                  id="initialPrice"
                  type="number"
                  min="0"
                  step="0.0001"
                  placeholder="0.001"
                  value={config.lpConfig.initialPrice}
                  onChange={(e) => setConfig({
                    ...config,
                    lpConfig: { ...config.lpConfig, initialPrice: e.target.value }
                  })}
                  className="mt-1"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label htmlFor="binStep">Bin Step</Label>
                  <Input
                    id="binStep"
                    type="number"
                    min="1"
                    value={config.lpConfig.binStep}
                    onChange={(e) => setConfig({
                      ...config,
                      lpConfig: { ...config.lpConfig, binStep: parseInt(e.target.value) || 100 }
                    })}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="minBinId">Min Bin ID</Label>
                  <Input
                    id="minBinId"
                    type="number"
                    value={config.lpConfig.minBinId}
                    onChange={(e) => setConfig({
                      ...config,
                      lpConfig: { ...config.lpConfig, minBinId: parseInt(e.target.value) || -1000 }
                    })}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="maxBinId">Max Bin ID</Label>
                  <Input
                    id="maxBinId"
                    type="number"
                    value={config.lpConfig.maxBinId}
                    onChange={(e) => setConfig({
                      ...config,
                      lpConfig: { ...config.lpConfig, maxBinId: parseInt(e.target.value) || 1000 }
                    })}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Access Control */}
        <TabsContent value="access" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Access Control</CardTitle>
              <CardDescription>
                Configure who can participate in the migration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* KYC Requirement */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="kyc">Require KYC</Label>
                  <p className="text-sm text-foreground-muted">
                    Require users to complete KYC before migrating
                  </p>
                </div>
                <Switch
                  id="kyc"
                  checked={config.requiresKYC}
                  onCheckedChange={(checked) => setConfig({ ...config, requiresKYC: checked })}
                />
              </div>

              {/* Allow List */}
              <div>
                <Label>Allow List (Optional)</Label>
                <p className="text-xs text-foreground-muted mb-3">
                  Only these addresses can participate
                </p>
                
                {config.allowList.length > 0 && (
                  <div className="mb-3 space-y-2">
                    {config.allowList.map((address, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="flex-1 text-sm font-mono bg-surface rounded px-3 py-1">
                          {address}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setConfig({
                            ...config,
                            allowList: config.allowList.filter((_, i) => i !== index)
                          })}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Input
                    placeholder="Wallet address"
                    value={newAllowAddress}
                    onChange={(e) => setNewAllowAddress(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
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

              {/* Deny List */}
              <div>
                <Label>Deny List (Optional)</Label>
                <p className="text-xs text-foreground-muted mb-3">
                  These addresses cannot participate
                </p>
                
                {config.denyList.length > 0 && (
                  <div className="mb-3 space-y-2">
                    {config.denyList.map((address, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="flex-1 text-sm font-mono bg-surface rounded px-3 py-1">
                          {address}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setConfig({
                            ...config,
                            denyList: config.denyList.filter((_, i) => i !== index)
                          })}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Input
                    placeholder="Wallet address"
                    value={newDenyAddress}
                    onChange={(e) => setNewDenyAddress(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
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

          {/* Special Ratios */}
          <Card>
            <CardHeader>
              <CardTitle>Special Exchange Rates</CardTitle>
              <CardDescription>
                Set custom exchange rates for specific addresses
              </CardDescription>
            </CardHeader>
            <CardContent>
              {config.specialRatios.length > 0 && (
                <div className="mb-4 space-y-2">
                  {config.specialRatios.map((ratio, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <span className="flex-1 font-mono bg-surface rounded px-3 py-1">
                        {ratio.address}
                      </span>
                      <span className="text-foreground-muted">
                        {ratio.oldAmount}:{ratio.newAmount}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfig({
                          ...config,
                          specialRatios: config.specialRatios.filter((_, i) => i !== index)
                        })}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="space-y-3">
                <Input
                  placeholder="Wallet address"
                  value={newSpecialRatio.address}
                  onChange={(e) => setNewSpecialRatio({ ...newSpecialRatio, address: e.target.value })}
                />
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    placeholder="1"
                    value={newSpecialRatio.oldAmount}
                    onChange={(e) => setNewSpecialRatio({ 
                      ...newSpecialRatio, 
                      oldAmount: parseInt(e.target.value) || 1 
                    })}
                    className="w-24"
                  />
                  <span className="text-sm">{config.oldToken.symbol || 'OLD'}</span>
                  <ArrowRight className="h-4 w-4" />
                  <Input
                    type="number"
                    min="1"
                    placeholder="2"
                    value={newSpecialRatio.newAmount}
                    onChange={(e) => setNewSpecialRatio({ 
                      ...newSpecialRatio, 
                      newAmount: parseInt(e.target.value) || 1 
                    })}
                    className="w-24"
                  />
                  <span className="text-sm">{config.newToken.symbol || 'NEW'}</span>
                  <Button
                    variant="outline"
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
        </TabsContent>
      </Tabs>

      {/* Navigation */}
      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={activeTab === 'basic'}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
          
          {activeTab === 'access' ? (
            <Button
              onClick={handleCreateProject}
              disabled={!config.name || !config.oldToken.address || !config.newToken.address || isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Project...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Create Project
                </>
              )}
            </Button>
          ) : (
            <Button onClick={handleNext}>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
    </RequireAdmin>
  );
}

// Post-create actions UI (renders below main content when project created)
// Kept simple within this page for now
export function PostCreateActions({
  projectId,
  fundAmount,
  setFundAmount,
  activateParams,
  setActivateParams,
  onFund,
  onActivate,
}: any) {
  if (projectId == null) return null;
  return (
    <div className="max-w-4xl mx-auto space-y-6 mt-6">
      <Card>
        <CardHeader>
          <CardTitle>Post-Create Actions</CardTitle>
          <CardDescription>Fund with new tokens and activate the project</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Fund Amount (new token base units)</Label>
            <div className="flex gap-2">
              <Input value={fundAmount} onChange={(e) => setFundAmount(e.target.value)} placeholder="100000000000" />
              <Button variant="outline" onClick={onFund}>Fund Project</Button>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Meteora Pool Address</Label>
              <Input value={activateParams.meteoraPool} onChange={(e) => setActivateParams({ ...activateParams, meteoraPool: e.target.value })} />
            </div>
            <div>
              <Label>LP Mint Address</Label>
              <Input value={activateParams.lpMint} onChange={(e) => setActivateParams({ ...activateParams, lpMint: e.target.value })} />
            </div>
            <div>
              <Label>Token Allocation (base units)</Label>
              <Input value={activateParams.tokenAllocation} onChange={(e) => setActivateParams({ ...activateParams, tokenAllocation: e.target.value })} />
            </div>
            <div>
              <Label>Initial Price (SOL per token)</Label>
              <Input value={activateParams.initialPrice} onChange={(e) => setActivateParams({ ...activateParams, initialPrice: e.target.value })} />
            </div>
            <div>
              <Label>Bin Step</Label>
              <Input type="number" value={activateParams.binStep} onChange={(e) => setActivateParams({ ...activateParams, binStep: parseInt(e.target.value) || 0 })} />
            </div>
            <div>
              <Label>Base Fee (bps)</Label>
              <Input type="number" value={activateParams.baseFee} onChange={(e) => setActivateParams({ ...activateParams, baseFee: parseInt(e.target.value) || 0 })} />
            </div>
            <div>
              <Label>Price Range Min (SOL)</Label>
              <Input value={activateParams.priceRangeMin} onChange={(e) => setActivateParams({ ...activateParams, priceRangeMin: e.target.value })} />
            </div>
            <div>
              <Label>Price Range Max (SOL)</Label>
              <Input value={activateParams.priceRangeMax} onChange={(e) => setActivateParams({ ...activateParams, priceRangeMax: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={onActivate}>Activate Project</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

<PostCreateActions
  projectId={createdProjectId}
  fundAmount={fundAmount}
  setFundAmount={setFundAmount}
  activateParams={activateParams}
  setActivateParams={setActivateParams}
  onFund={handleFundProject}
  onActivate={handleActivateProject}
/>

