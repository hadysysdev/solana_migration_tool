'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TierConfig, Tier } from '@/components/w3swap/TierConfig';
import {
  fetchTokenHolders,
  processSnapshot,
  flagLiquidityPools,
  getTokenMetadata,
  exportToCSV,
  exportToJSON,
  SnapshotResult,
  SnapshotConfig,
  SnapshotMetadata,
  TokenMetadata,
} from '@/lib/snapshot';
import {
  Loader2,
  Download,
  AlertCircle,
  Coins,
  FileText,
  Camera,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const ITEMS_PER_PAGE = 20;

export default function SnapshotPage() {
  const [tokenMint, setTokenMint] = useState('5Q8RSzXAybeLYkf76mMP5a5C9ikc8y4Qq9raJqKapump');
  const [minThreshold, setMinThreshold] = useState(1000);
  const [tiers, setTiers] = useState<Tier[]>([
    { id: 1, min: 0, max: undefined, ratio: 1.0 },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<SnapshotResult[]>([]);
  const [tokenMetadata, setTokenMetadata] = useState<TokenMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filtering and pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<number | 'all'>('all');
  const [minBalance, setMinBalance] = useState('');
  const [maxBalance, setMaxBalance] = useState('');
  const [showLPs, setShowLPs] = useState<boolean | 'all'>('all'); // 'all', true (only LPs), false (exclude LPs)
  const [excludePDAs, setExcludePDAs] = useState(true); // Default: exclude PDAs from exports
  const [currentPage, setCurrentPage] = useState(1);

  // Filtered results
  const filteredResults = results.filter((result) => {
    if (searchQuery && !result.wallet.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (selectedTier !== 'all' && result.tier !== selectedTier) {
      return false;
    }
    if (minBalance && result.balanceDisplay < parseFloat(minBalance)) {
      return false;
    }
    if (maxBalance && result.balanceDisplay > parseFloat(maxBalance)) {
      return false;
    }
    if (showLPs !== 'all') {
      if (showLPs === true && !result.isLiquidityPool) return false;
      if (showLPs === false && result.isLiquidityPool) return false;
    }
    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredResults.length / ITEMS_PER_PAGE);
  const paginatedResults = filteredResults.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleTakeSnapshot = useCallback(async () => {
    if (!tokenMint.trim()) {
      toast.error('Please enter a token mint address');
      return;
    }

    setIsLoading(true);
    setIsFetching(true);
    setError(null);
    setResults([]);
    setProgress(0);

    try {
      // Validate token mint
      const metadata = await getTokenMetadata(tokenMint);
      if (!metadata) {
        throw new Error('Invalid token mint address or token not found');
      }
      setTokenMetadata(metadata);

      // Fetch holders
      const holders = await fetchTokenHolders(tokenMint, (count) => {
        setProgress(count);
      });

      if (holders.size === 0) {
        throw new Error('No token holders found');
      }

      // Process snapshot
      const config: SnapshotConfig = {
        tokenMint,
        minThreshold,
        tiers,
      };

      const processed = processSnapshot(holders, config);
      
      // Flag liquidity pools (must be called after processSnapshot)
      await flagLiquidityPools(processed);
      
      setResults(processed);
      toast.success(`Snapshot complete: ${processed.length} holders found`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to take snapshot';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
      setIsFetching(false);
      setProgress(0);
    }
  }, [tokenMint, minThreshold, tiers]);

  const handleExportCSV = () => {
    if (results.length === 0) {
      toast.error('No snapshot data to export');
      return;
    }

    const metadata: SnapshotMetadata = {
      tokenMint,
      snapshotDate: new Date().toISOString(),
      minThreshold,
      totalHolders: results.length,
      totalTokens: results.reduce((sum, r) => sum + r.balanceDisplay, 0),
      tierConfig: tiers,
    };

    const csv = exportToCSV(results, metadata, excludePDAs);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `snapshot-${tokenMint.slice(0, 8)}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported successfully');
  };

  const handleExportJSON = () => {
    if (results.length === 0) {
      toast.error('No snapshot data to export');
      return;
    }

    const metadata: SnapshotMetadata = {
      tokenMint,
      snapshotDate: new Date().toISOString(),
      minThreshold,
      totalHolders: results.length,
      totalTokens: results.reduce((sum, r) => sum + r.balanceDisplay, 0),
      tierConfig: tiers,
    };

    const json = exportToJSON(results, metadata, excludePDAs);
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `snapshot-${tokenMint.slice(0, 8)}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('JSON exported successfully');
  };

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedTier, minBalance, maxBalance, showLPs]);

  const uniqueTiers = Array.from(new Set(results.map((r) => r.tier))).sort((a, b) => a - b);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-cyan-500 via-purple-500 to-teal-500 bg-clip-text text-transparent">
          Token Snapshot
        </h1>
        <p className="mt-2 text-slate-400">
          Take a snapshot of token holders with filtering and tier-based ratio configuration
        </p>
      </motion.div>

      {/* Configuration Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-white">Snapshot Configuration</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Configure token mint, minimum threshold, and tier ratios
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Compact input row */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="tokenMint" className="text-xs text-slate-300">
                  Token Mint Address <span className="text-yellow-400">*</span>
                </Label>
                <Input
                  id="tokenMint"
                  placeholder="5Q8RSzXAybeLYkf76mMP5a5C9ikc8y4Qq9raJqKapump"
                  value={tokenMint}
                  onChange={(e) => setTokenMint(e.target.value)}
                  className="mt-1 h-9 text-sm font-mono bg-slate-900/50 border-slate-700 text-white"
                />
              </div>

              <div>
                <Label htmlFor="minThreshold" className="text-xs text-slate-300">
                  Minimum Threshold
                </Label>
                <Input
                  id="minThreshold"
                  type="number"
                  min="0"
                  step="0.01"
                  value={minThreshold}
                  onChange={(e) => setMinThreshold(parseFloat(e.target.value) || 0)}
                  className="mt-1 h-9 text-sm bg-slate-900/50 border-slate-700 text-white"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Exclude holders below this amount
                </p>
              </div>
            </div>

            <TierConfig tiers={tiers} onChange={setTiers} />

            {tokenMetadata && (
              <Alert className="bg-cyan-500/10 border-cyan-500/30">
                <Coins className="h-4 w-4 text-cyan-400" />
                <AlertDescription className="text-cyan-300">
                  <strong>{tokenMetadata.symbol}</strong> ({tokenMetadata.name}) -{' '}
                  {tokenMetadata.decimals} decimals
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert className="bg-red-500/10 border-red-500/30">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-300">{error}</AlertDescription>
              </Alert>
            )}

            <div className="pt-2">
              <Button
                onClick={handleTakeSnapshot}
                disabled={isLoading || !tokenMint.trim()}
                className="w-full btn-brand"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isFetching ? `Fetching holders... (${progress})` : 'Processing...'}
                  </>
                ) : (
                  <>
                    <Camera className="mr-2 h-4 w-4" />
                    Take Snapshot
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Results */}
      {results.length > 0 && (
        <>
          {/* Summary Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid gap-3 md:grid-cols-4"
          >
            {[
              { label: 'Total Holders', value: results.length.toLocaleString(), color: 'cyan' },
              {
                label: 'Total Tokens',
                value: results
                  .reduce((sum, r) => sum + r.balanceDisplay, 0)
                  .toLocaleString(undefined, { maximumFractionDigits: 2 }),
                color: 'purple',
              },
              { 
                label: 'Liquidity Pools', 
                value: results.filter(r => r.isLiquidityPool).length.toLocaleString(), 
                color: 'orange' 
              },
              { 
                label: 'PDAs', 
                value: results.filter(r => r.isPDA).length.toLocaleString(), 
                color: 'yellow' 
              },
            ].map((stat, index) => (
              <Card key={stat.label} className="glass-card">
                <CardHeader className="pb-2 pt-4">
                  <CardDescription className="text-xs text-slate-400">{stat.label}</CardDescription>
                  <CardTitle
                    className={`text-xl ${
                      stat.color === 'cyan'
                        ? 'text-cyan-400'
                        : stat.color === 'purple'
                        ? 'text-purple-400'
                        : stat.color === 'orange'
                        ? 'text-orange-400'
                        : stat.color === 'yellow'
                        ? 'text-yellow-400'
                        : 'text-teal-400'
                    }`}
                  >
                    {stat.value}
                  </CardTitle>
                </CardHeader>
              </Card>
            ))}
          </motion.div>

          {/* Export Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-white">Export Snapshot</CardTitle>
                <CardDescription className="text-xs text-slate-400">Download the full snapshot data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="excludePDAs"
                    checked={excludePDAs}
                    onCheckedChange={(checked) => setExcludePDAs(checked === true)}
                  />
                  <Label
                    htmlFor="excludePDAs"
                    className="text-sm text-slate-300 cursor-pointer"
                  >
                    Exclude PDAs from exports
                  </Label>
                </div>
                <div className="flex gap-3">
                  <Button onClick={handleExportCSV} variant="outline" className="flex-1" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                  </Button>
                  <Button onClick={handleExportJSON} variant="outline" className="flex-1" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Export JSON
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-white">Filters</CardTitle>
                <CardDescription className="text-xs text-slate-400">Filter and search snapshot results</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
                  <div>
                    <Label htmlFor="search" className="text-xs text-slate-300">Search Wallet</Label>
                    <Input
                      id="search"
                      placeholder="Search address..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="mt-1 h-9 text-sm font-mono bg-slate-900/50 border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tier" className="text-xs text-slate-300">Tier</Label>
                    <select
                      id="tier"
                      value={selectedTier}
                      onChange={(e) =>
                        setSelectedTier(
                          e.target.value === 'all' ? 'all' : parseInt(e.target.value)
                        )
                      }
                      className="mt-1 flex h-9 w-full rounded-md border border-slate-700 bg-slate-900/50 px-3 py-2 text-sm text-white"
                    >
                      <option value="all">All Tiers</option>
                      {uniqueTiers.map((tier) => (
                        <option key={tier} value={tier}>
                          Tier {tier}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="lpFilter" className="text-xs text-slate-300">Liquidity Pools</Label>
                    <select
                      id="lpFilter"
                      value={showLPs === 'all' ? 'all' : showLPs ? 'only' : 'exclude'}
                      onChange={(e) => {
                        const val = e.target.value;
                        setShowLPs(val === 'all' ? 'all' : val === 'only' ? true : false);
                      }}
                      className="mt-1 flex h-9 w-full rounded-md border border-slate-700 bg-slate-900/50 px-3 py-2 text-sm text-white"
                    >
                      <option value="all">All</option>
                      <option value="only">Only LPs</option>
                      <option value="exclude">Exclude LPs</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="minBalance" className="text-xs text-slate-300">Min Balance</Label>
                    <Input
                      id="minBalance"
                      type="number"
                      placeholder="0"
                      value={minBalance}
                      onChange={(e) => setMinBalance(e.target.value)}
                      className="mt-1 h-9 text-sm bg-slate-900/50 border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxBalance" className="text-xs text-slate-300">Max Balance</Label>
                    <Input
                      id="maxBalance"
                      type="number"
                      placeholder="∞"
                      value={maxBalance}
                      onChange={(e) => setMaxBalance(e.target.value)}
                      className="mt-1 h-9 text-sm bg-slate-900/50 border-slate-700 text-white"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Results Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-white">Snapshot Results</CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Showing {paginatedResults.length} of {filteredResults.length} holders
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left p-2 font-medium text-slate-300">Wallet</th>
                        <th className="text-right p-2 font-medium text-slate-300">Balance</th>
                        <th className="text-center p-2 font-medium text-slate-300">Tier</th>
                        <th className="text-right p-2 font-medium text-slate-300">Ratio</th>
                        <th className="text-right p-2 font-medium text-slate-300">New Token Amount</th>
                        <th className="text-center p-2 font-medium text-slate-300">Label</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedResults.map((result, index) => (
                        <tr
                          key={result.wallet}
                          className="border-b border-slate-700/50 hover:bg-slate-900/50"
                        >
                          <td className="p-2 font-mono text-xs text-slate-300">
                            {result.wallet.slice(0, 8)}...{result.wallet.slice(-8)}
                          </td>
                          <td className="p-2 text-right text-slate-300">
                            {result.balanceDisplay.toLocaleString(undefined, {
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className="p-2 text-center">
                            <span className="inline-flex items-center rounded-full bg-cyan-500/10 px-2 py-1 text-xs font-medium text-cyan-400">
                              Tier {result.tier}
                            </span>
                          </td>
                          <td className="p-2 text-right text-slate-300">1:{result.ratio.toFixed(2)}</td>
                          <td className="p-2 text-right font-medium text-white">
                            {result.newTokenAmount.toLocaleString(undefined, {
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className="p-2 text-center">
                            <div className="flex flex-col gap-1 items-center">
                              {result.isLiquidityPool && result.ownerLabel ? (
                                <span className="inline-flex items-center rounded-full bg-orange-500/10 px-2 py-1 text-xs font-medium text-orange-400">
                                  {result.ownerLabel}
                                </span>
                              ) : null}
                              {result.isPDA ? (
                                <span className="inline-flex items-center rounded-full bg-yellow-500/10 px-2 py-1 text-xs font-medium text-yellow-400">
                                  PDA
                                </span>
                              ) : null}
                              {!result.isLiquidityPool && !result.isPDA && (
                                <span className="text-xs text-slate-500">—</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-slate-400">
                      Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="border-slate-700 hover:border-cyan-500"
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="border-slate-700 hover:border-cyan-500"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </div>
  );
}

