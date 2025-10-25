'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Coins, 
  Info, 
  Upload, 
  Loader2
} from 'lucide-react';
import { useAnchorWallet, useWallet } from '@solana/wallet-adapter-react';
import { getConnection } from '@/lib/anchor';
import { PublicKey, Keypair, SystemProgram, Transaction } from '@solana/web3.js';
import { TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@/lib/constants';
import {
  MINT_SIZE,
  TYPE_SIZE,
  LENGTH_SIZE,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createInitializeMintInstruction,
  createMintToInstruction,
  ExtensionType,
  getMintLen,
  createInitializeMetadataPointerInstruction,
  createInitializeTransferFeeConfigInstruction,
  createInitializeMintCloseAuthorityInstruction,
  createInitializeNonTransferableMintInstruction,
  createInitializePermanentDelegateInstruction,
} from '@solana/spl-token';
import { createInitializeInstruction as createTokenMetadataInitializeInstruction, pack as packTokenMetadata } from '@solana/spl-token-metadata';
import { toast } from 'sonner';

interface TokenMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  externalUrl: string;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
}

interface TokenExtensions {
  transferFee: boolean;
  transferFeeConfig?: {
    feeBasisPoints?: number;
    maxFee?: number;
    withdrawAuthority?: string;
    transferFeeAuthority?: string;
  };
  mintCloseAuthority: boolean;
  interestBearing: boolean;
  interestBearingConfig?: {
    rate?: number;
    rateAuthority?: string;
  };
  nonTransferable: boolean;
  permanentDelegate: boolean;
  permanentDelegateAddress?: string;
}

export default function CreateToken2022Page() {
  const wallet = useAnchorWallet();
  const { sendTransaction } = useWallet();
  const [isCreating, setIsCreating] = useState(false);
  const [tokenConfig, setTokenConfig] = useState({
    decimals: 9,
    initialSupply: '',
    mintAuthority: '',
    freezeAuthority: '',
    metadataAuthority: '',
  });

  const [metadata, setMetadata] = useState<TokenMetadata>({
    name: '',
    symbol: '',
    description: '',
    image: '',
    externalUrl: '',
    attributes: [],
  });

  // Preview state derived from external JSON metadata (if provided)
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [extensions, setExtensions] = useState<TokenExtensions>({
    transferFee: false,
    mintCloseAuthority: false,
    interestBearing: false,
    nonTransferable: false,
    permanentDelegate: false,
  });

  const [newAttribute, setNewAttribute] = useState({ trait_type: '', value: '' });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Live logs for UX + debugging
  const [logs, setLogs] = useState<string[]>([]);
  const pushLog = (msg: string) => {
    const ts = new Date().toISOString().replace('T', ' ').replace('Z', '');
    setLogs((l) => [...l, `[${ts}] ${msg}`]);
    // Also mirror to console for deep inspection
    // eslint-disable-next-line no-console
    console.log(msg);
  };

  // Prefill authorities with connected wallet when available
  useEffect(() => {
    const pk = wallet?.publicKey?.toBase58();
    if (!pk) return;
    setTokenConfig((prev) => ({
      ...prev,
      mintAuthority: prev.mintAuthority || pk,
      freezeAuthority: prev.freezeAuthority || pk,
    }));
  }, [wallet?.publicKey?.toBase58()]);

  const metadataAuthorityOrDefault = (pk: PublicKey) => {
    try { return tokenConfig.metadataAuthority ? new PublicKey(tokenConfig.metadataAuthority) : pk; } catch { return pk; }
  };

  // Live preview: if externalUrl points to a JSON metadata, use its image field
  useEffect(() => {
    const url = (metadata.externalUrl || '').trim();
    if (!url || !(url.startsWith('http://') || url.startsWith('https://'))) {
      setPreviewImage(metadata.image || null);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(url, { method: 'GET' });
        const ct = res.headers.get('content-type') || '';
        if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
        // Try parse as JSON when content-type suggests so or URL ends with .json
        if (ct.includes('application/json') || url.toLowerCase().endsWith('.json')) {
          const j = await res.json();
          const hasShape = j && typeof j === 'object' && j.name && j.symbol && j.description && j.image && Array.isArray(j.attributes);
          if (hasShape && typeof j.image === 'string') {
            if (!cancelled) setPreviewImage(j.image as string);
            return;
          }
        }
        // Fallback to raw image URL if not JSON
        if (!cancelled) setPreviewImage(metadata.image || null);
      } catch {
        if (!cancelled) setPreviewImage(metadata.image || null);
      }
    })();
    return () => { cancelled = true; };
  }, [metadata.externalUrl, metadata.image]);

  const handleAddAttribute = () => {
    if (newAttribute.trait_type && newAttribute.value) {
      setMetadata({
        ...metadata,
        attributes: [...metadata.attributes, newAttribute],
      });
      setNewAttribute({ trait_type: '', value: '' });
    }
  };

  const handleRemoveAttribute = (index: number) => {
    setMetadata({
      ...metadata,
      attributes: metadata.attributes.filter((_, i) => i !== index),
    });
  };

  const handlePickImage = () => fileInputRef.current?.click();
  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setMetadata((prev) => ({ ...prev, image: url }));
  };

  const pow10 = (d: number) => BigInt(10) ** BigInt(Math.max(0, Math.min(18, d)));

  const handleCreateToken = async () => {
    if (!wallet?.publicKey) {
      toast.error('Connect your wallet to create a token');
      return;
    }
    try {
      setIsCreating(true);
      const connection = getConnection();
      pushLog('Starting token creation...');

      const decimals = Number(tokenConfig.decimals) || 0;
      const mintAuthority = tokenConfig.mintAuthority ? new PublicKey(tokenConfig.mintAuthority) : wallet.publicKey;
      const freezeAuthority = tokenConfig.freezeAuthority ? new PublicKey(tokenConfig.freezeAuthority) : wallet.publicKey;

      // Prepare metadata core fields early for sizing
      const name = metadata.name || '';
      const symbol = metadata.symbol || '';
      // Ignore the image field for on-chain metadata URI; use the provided external URL
      const uri = metadata.externalUrl || '';

      // Create mint keypair first so we can size TokenMetadata against it
      const mintKeypair = Keypair.generate();

      // Compute required mint space based on selected extensions (include TokenMetadata variable length)
      const extList: ExtensionType[] = [ExtensionType.MetadataPointer as any];
      if (extensions.transferFee) extList.push(ExtensionType.TransferFeeConfig as any);
      if (extensions.mintCloseAuthority) extList.push(ExtensionType.MintCloseAuthority as any);
      if (extensions.interestBearing) extList.push(ExtensionType.InterestBearingConfig as any);
      if (extensions.nonTransferable) extList.push(ExtensionType.NonTransferable as any);
      if (extensions.permanentDelegate) extList.push(ExtensionType.PermanentDelegate as any);

      // TokenMetadata is variable-length — include its packed size in mint allocation
      const tokenMetadataLen = packTokenMetadata({
        mint: mintKeypair.publicKey,
        name,
        symbol,
        uri,
        additionalMetadata: [],
      } as any).length;
      const mintSpace = getMintLen(extList as any, { [ExtensionType.TokenMetadata]: tokenMetadataLen } as any);
      try { pushLog(`Extensions: ${extList.map((e) => ExtensionType[e as any]).join(', ') || 'None'}`); } catch {}
      pushLog(`TokenMetadata length: ${tokenMetadataLen} bytes`);
      pushLog(`Computed mint space: ${mintSpace} bytes`);

      // Allocate mint to MetadataPointer size but fund rent to cover metadata TLV
      const spaceWithout = getMintLen([ExtensionType.MetadataPointer as any] as any);
      const lamports = await connection.getMinimumBalanceForRentExemption(
        spaceWithout + tokenMetadataLen + TYPE_SIZE + LENGTH_SIZE,
      );
      pushLog(`TokenMetadata length: ${tokenMetadataLen} bytes`);
      pushLog(`Mint space (MetadataPointer only): ${spaceWithout} bytes`);
      pushLog(`Creating mint account; rent=${lamports} lamports`);

      const fullTx = new Transaction();
      fullTx.add(SystemProgram.createAccount({
        fromPubkey: wallet.publicKey!,
        newAccountPubkey: mintKeypair.publicKey,
        space: spaceWithout,
        lamports,
        programId: TOKEN_2022_PROGRAM_ID,
      }));

      const mdUpdateAuth = metadataAuthorityOrDefault(wallet.publicKey!);
      pushLog(`Metadata update authority: ${mdUpdateAuth.toBase58()}`);
      fullTx.add(createInitializeMetadataPointerInstruction(
        mintKeypair.publicKey,
        mdUpdateAuth,
        mintKeypair.publicKey,
        TOKEN_2022_PROGRAM_ID,
      ));
      fullTx.add(createInitializeMintInstruction(
        mintKeypair.publicKey,
        decimals,
        mintAuthority,
        freezeAuthority,
        TOKEN_2022_PROGRAM_ID,
      ));

      // Transfer Fee Config
      if (extensions.transferFee) {
        const feeBps = Number(extensions.transferFeeConfig?.feeBasisPoints || 0);
        const maxFee = Number(extensions.transferFeeConfig?.maxFee || 0);
        const maxFeeBig = BigInt(maxFee);
        const tfa = new PublicKey(extensions.transferFeeConfig?.transferFeeAuthority || wallet.publicKey!);
        const wwa = new PublicKey(extensions.transferFeeConfig?.withdrawAuthority || wallet.publicKey!);
        fullTx.add(createInitializeTransferFeeConfigInstruction(
          mintKeypair.publicKey,
          tfa,
          wwa,
          feeBps,
          maxFeeBig,
          TOKEN_2022_PROGRAM_ID,
        ));
        pushLog(`TransferFeeConfig set: bps=${feeBps}, maxFee=${maxFee}`);
      }

      // Mint Close Authority
      if (extensions.mintCloseAuthority) {
        const closeAuth = freezeAuthority;
        fullTx.add(createInitializeMintCloseAuthorityInstruction(
          mintKeypair.publicKey,
          closeAuth,
          TOKEN_2022_PROGRAM_ID,
        ));
        pushLog(`MintCloseAuthority set: ${closeAuth.toBase58()}`);
      }

      // Interest Bearing Config
      if (extensions.interestBearing) {
        // Not supported by current JS SDK; skipping initialization
        console.warn('InterestBearingConfig extension not supported in current @solana/spl-token. Skipping.');
        pushLog('InterestBearingConfig not supported by SDK — skipped.');
      }

      // Non-Transferable
      if (extensions.nonTransferable) {
        fullTx.add(createInitializeNonTransferableMintInstruction(
          mintKeypair.publicKey,
          TOKEN_2022_PROGRAM_ID,
        ));
        pushLog('NonTransferable enabled');
      }

      // Permanent Delegate
      if (extensions.permanentDelegate) {
        const delegate = new PublicKey(extensions.permanentDelegateAddress || wallet.publicKey!);
        fullTx.add(createInitializePermanentDelegateInstruction(
          mintKeypair.publicKey,
          delegate,
          TOKEN_2022_PROGRAM_ID,
        ));
        pushLog(`PermanentDelegate set: ${delegate.toBase58()}`);
      }
      // initializeMint moved earlier

      // Initialize on-chain Token-2022 metadata (name, symbol, uri)
      // The token-metadata extension stores TLV on the metadata account. Since we
      // pointed the MetadataPointer at the mint itself, `metadata` equals the mint.
      fullTx.add(
        createTokenMetadataInitializeInstruction({
          programId: TOKEN_2022_PROGRAM_ID,
          metadata: mintKeypair.publicKey,
          updateAuthority: mdUpdateAuth,
          mint: mintKeypair.publicKey,
          mintAuthority,
          name,
          symbol,
          uri,
        })
      );
      pushLog(`Metadata init: name='${name}', symbol='${symbol}', uri='${uri}'`);

      const initialUi = tokenConfig.initialSupply ? Number(tokenConfig.initialSupply) : 0;
      const initialRaw = initialUi > 0 ? BigInt(Math.trunc(initialUi)) * pow10(decimals) : 0n;
      if (initialRaw > 0n) {
        const ata = await getAssociatedTokenAddress(
          mintKeypair.publicKey,
          mintAuthority,
          false,
          TOKEN_2022_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID,
        );
        fullTx.add(createAssociatedTokenAccountInstruction(
          wallet.publicKey!,
          ata,
          mintAuthority,
          mintKeypair.publicKey,
          TOKEN_2022_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID,
        ));
        fullTx.add(createMintToInstruction(
          mintKeypair.publicKey,
          ata,
          mintAuthority,
          initialRaw,
          [],
          TOKEN_2022_PROGRAM_ID,
        ));
        pushLog(`Initial supply: ${initialUi} tokens (raw=${initialRaw.toString()}) to ATA ${ata.toBase58()}`);
      }

      // Send single transaction
      fullTx.feePayer = wallet.publicKey!;
      const { blockhash } = await connection.getLatestBlockhash();
      fullTx.recentBlockhash = blockhash;
      fullTx.partialSign(mintKeypair);
      pushLog('Submitting single transaction for mint + metadata...');
      const txSig = await sendTransaction(fullTx, connection, { signers: [mintKeypair] });
      pushLog(`Submitted signature: ${txSig}`);
      toast.success(`Token created: ${mintKeypair.publicKey.toBase58()}`);
      return;
      toast.success(`Token created: ${mintKeypair.publicKey.toBase58()}`);
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.error('Token creation error', e);
      try { pushLog(`Error message: ${e?.message || e}`); } catch {}
      try { if (e?.code) pushLog(`Error code: ${e.code}`); } catch {}
      try { if (e?.logs) (e.logs as string[]).forEach((l: string) => pushLog(`[wallet] ${l}`)); } catch {}
      try { if (e?.stack) pushLog(e.stack); } catch {}
      toast.error(e?.message || 'Failed to create token');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Create Token-2022</h1>
        <p className="mt-2 text-foreground-muted">
          Deploy a new SPL Token-2022 with metadata and optional extensions
        </p>
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Token-2022 (Token Extensions) allows for advanced features like transfer fees, 
          interest bearing tokens, and more. Metadata is stored on-chain for better discoverability.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Basic Configuration</TabsTrigger>
          <TabsTrigger value="metadata">Metadata</TabsTrigger>
          <TabsTrigger value="extensions">Extensions</TabsTrigger>
        </TabsList>

        {/* Live Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Live Preview</CardTitle>
            <CardDescription>How your token will look</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-start">
              <div className="w-20 h-20 rounded bg-surface overflow-hidden flex items-center justify-center">
                {previewImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewImage} alt="Token" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs text-foreground-muted">No image</span>
                )}
              </div>
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div>
                  <div className="text-foreground">Name</div>
                  <div className="text-foreground-muted">{metadata.name || '(unset)'}</div>
                </div>
                <div>
                  <div className="text-foreground">Symbol</div>
                  <div className="text-foreground-muted">{metadata.symbol || '(unset)'}{tokenConfig.decimals !== undefined ? ` · ${tokenConfig.decimals} dp` : ''}</div>
                </div>
                <div>
                  <div className="text-foreground">Mint Authority</div>
                  <div className="text-foreground-muted break-all">{tokenConfig.mintAuthority || wallet?.publicKey?.toBase58() || '(unset)'}</div>
                </div>
                <div>
                  <div className="text-foreground">Freeze Authority</div>
                  <div className="text-foreground-muted break-all">{tokenConfig.freezeAuthority || wallet?.publicKey?.toBase58() || '(unset)'}</div>
                </div>
                <div className="sm:col-span-2">
                  <div className="text-foreground">Extensions</div>
                  <div className="text-foreground-muted">
                    {Object.entries(extensions)
                      .filter(([k, v]) => typeof v === 'boolean')
                      .map(([k, v]) => `${k}: ${v ? 'on' : 'off'}`)
                      .join(' · ')}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <div className="text-foreground">Initial Supply</div>
                  <div className="text-foreground-muted">
                    {tokenConfig.initialSupply ? `${tokenConfig.initialSupply} tokens` : '(unset)'}
                    {tokenConfig.initialSupply && typeof tokenConfig.decimals === 'number' ? (
                      (() => {
                        try {
                          const d = Math.max(0, Math.min(9, Number(tokenConfig.decimals || 0)));
                          const rawStr = `${Math.trunc(Number(tokenConfig.initialSupply))}${'0'.repeat(d)}`;
                          return ` · raw=${rawStr} (decimals=${tokenConfig.decimals})`;
                        } catch { return ''; }
                      })()
                    ) : ''}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Basic Configuration */}
        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Token Configuration</CardTitle>
              <CardDescription>
                Set up the basic parameters for your token
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="decimals">Decimals</Label>
                <Input
                  id="decimals"
                  type="number"
                  min="0"
                  max="9"
                  value={tokenConfig.decimals}
                  onChange={(e) => setTokenConfig({ ...tokenConfig, decimals: parseInt(e.target.value) || 0 })}
                  className="mt-1"
                />
                <p className="text-xs text-foreground-muted mt-1">
                  Number of decimal places (0-9). Most tokens use 6 or 9.
                </p>
              </div>

              <div>
                <Label htmlFor="supply">Initial Supply</Label>
                <Input
                  id="supply"
                  type="text"
                  placeholder="1000000000"
                  value={tokenConfig.initialSupply}
                  onChange={(e) => setTokenConfig({ ...tokenConfig, initialSupply: e.target.value })}
                  className="mt-1"
                />
                <p className="text-xs text-foreground-muted mt-1">
                  Initial token supply (without decimals)
                </p>
              </div>

              <div>
                <Label htmlFor="mintAuth">Mint Authority (Optional)</Label>
                <Input
                  id="mintAuth"
                  type="text"
                  placeholder="Wallet address or leave empty to disable"
                  value={tokenConfig.mintAuthority}
                  onChange={(e) => setTokenConfig({ ...tokenConfig, mintAuthority: e.target.value })}
                  className="mt-1"
                />
                <p className="text-xs text-foreground-muted mt-1">
                  Address that can mint new tokens. Leave empty to disable minting.
                </p>
              </div>

              <div>
                <Label htmlFor="freezeAuth">Freeze Authority (Optional)</Label>
                <Input
                  id="freezeAuth"
                  type="text"
                  placeholder="Wallet address or leave empty to disable"
                  value={tokenConfig.freezeAuthority}
                  onChange={(e) => setTokenConfig({ ...tokenConfig, freezeAuthority: e.target.value })}
                  className="mt-1"
                />
                <p className="text-xs text-foreground-muted mt-1">
                  Address that can freeze token accounts. Leave empty to disable freezing.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Metadata */}
        <TabsContent value="metadata" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Token Metadata</CardTitle>
              <CardDescription>
                On-chain metadata for your token
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="name">Token Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="My Token"
                    value={metadata.name}
                    onChange={(e) => setMetadata({ ...metadata, name: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="symbol">Symbol</Label>
                  <Input
                    id="symbol"
                    type="text"
                    placeholder="MTK"
                    value={metadata.symbol}
                    onChange={(e) => setMetadata({ ...metadata, symbol: e.target.value.toUpperCase() })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your token..."
                  value={metadata.description}
                  onChange={(e) => setMetadata({ ...metadata, description: e.target.value })}
                  className="mt-1 h-24"
                />
              </div>

              <div>
                <Label htmlFor="image">Image URL</Label>
                <div className="mt-1 flex gap-2">
                  <Input
                    id="image"
                    type="text"
                    placeholder="https://example.com/token-logo.png"
                    value={metadata.image}
                    onChange={(e) => setMetadata({ ...metadata, image: e.target.value })}
                  />
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  <Button type="button" onClick={handlePickImage} variant="outline" size="icon" title="Upload image">
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-foreground-muted mt-1">
                  Direct link to your token logo (PNG, JPG, GIF)
                </p>
              </div>

              <div>
                <Label htmlFor="external">External URL (Optional)</Label>
                <Input
                  id="external"
                  type="text"
                  placeholder="https://yourproject.com"
                  value={metadata.externalUrl}
                  onChange={(e) => setMetadata({ ...metadata, externalUrl: e.target.value })}
                  className="mt-1"
                />
              </div>

              {/* Attributes */}
              <div>
                <Label>Attributes (Optional)</Label>
                <p className="text-xs text-foreground-muted mb-3">
                  Add custom attributes to your token metadata
                </p>
                
                {metadata.attributes.length > 0 && (
                  <div className="mb-3 space-y-2">
                    {metadata.attributes.map((attr, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <span className="flex-1 bg-surface rounded px-3 py-1">
                          {attr.trait_type}: {attr.value}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAttribute(index)}
                          className="text-danger-400 hover:text-danger-300"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <Input
                    placeholder="Trait type"
                    value={newAttribute.trait_type}
                    onChange={(e) => setNewAttribute({ ...newAttribute, trait_type: e.target.value })}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Value"
                    value={newAttribute.value}
                    onChange={(e) => setNewAttribute({ ...newAttribute, value: e.target.value })}
                    className="flex-1"
                  />
                  <Button onClick={handleAddAttribute} variant="outline">
                    Add
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Extensions */}
        <TabsContent value="extensions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Token Extensions</CardTitle>
              <CardDescription>
                Enable advanced features for your token
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Transfer Fee */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="transferFee" className="text-base">
                      Transfer Fee
                    </Label>
                    <p className="text-sm text-foreground-muted">
                      Charge a fee on every token transfer
                    </p>
                  </div>
                  <Switch
                    id="transferFee"
                    checked={extensions.transferFee}
                    onCheckedChange={(checked) => setExtensions({ ...extensions, transferFee: checked })}
                  />
                </div>
                
                {extensions.transferFee && (
                  <div className="ml-6 space-y-3 border-l-2 border-border pl-6">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="feeBps" className="text-sm">Fee (basis points)</Label>
                        <Input
                          id="feeBps"
                          type="number"
                          placeholder="100"
                          className="mt-1"
                          value={extensions.transferFeeConfig?.feeBasisPoints ?? ''}
                          onChange={(e) => setExtensions({
                            ...extensions,
                            transferFeeConfig: { ...(extensions.transferFeeConfig || {}), feeBasisPoints: Number(e.target.value || 0) },
                          })}
                        />
                        <p className="text-xs text-foreground-muted mt-1">100 = 1%</p>
                      </div>
                      <div>
                        <Label htmlFor="maxFee" className="text-sm">Max Fee</Label>
                        <Input
                          id="maxFee"
                          type="text"
                          placeholder="1000000"
                          className="mt-1"
                          value={extensions.transferFeeConfig?.maxFee ?? ''}
                          onChange={(e) => setExtensions({
                            ...extensions,
                            transferFeeConfig: { ...(extensions.transferFeeConfig || {}), maxFee: Number(e.target.value || 0) },
                          })}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Mint Close Authority */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="mintClose" className="text-base">
                    Mint Close Authority
                  </Label>
                  <p className="text-sm text-foreground-muted">
                    Allow the mint account to be closed
                  </p>
                </div>
                <Switch
                  id="mintClose"
                  checked={extensions.mintCloseAuthority}
                  onCheckedChange={(checked) => setExtensions({ ...extensions, mintCloseAuthority: checked })}
                />
              </div>

              {/* Interest Bearing */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="interest" className="text-base">
                      Interest Bearing
                    </Label>
                    <p className="text-sm text-foreground-muted">
                      Tokens automatically accrue interest
                    </p>
                  </div>
                  <Switch
                    id="interest"
                    checked={extensions.interestBearing}
                    onCheckedChange={(checked) => setExtensions({ ...extensions, interestBearing: checked })}
                  />
                </div>
              </div>

              {/* Non-Transferable */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="nonTransferable" className="text-base">
                    Non-Transferable
                  </Label>
                  <p className="text-sm text-foreground-muted">
                    Tokens cannot be transferred (soulbound)
                  </p>
                </div>
                <Switch
                  id="nonTransferable"
                  checked={extensions.nonTransferable}
                  onCheckedChange={(checked) => setExtensions({ ...extensions, nonTransferable: checked })}
                />
              </div>

              {/* Permanent Delegate */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="permanentDelegate" className="text-base">
                      Permanent Delegate
                    </Label>
                    <p className="text-sm text-foreground-muted">
                      An address that can always transfer tokens
                    </p>
                  </div>
                  <Switch
                    id="permanentDelegate"
                    checked={extensions.permanentDelegate}
                    onCheckedChange={(checked) => setExtensions({ ...extensions, permanentDelegate: checked })}
                  />
                </div>
                
                {extensions.permanentDelegate && (
                  <div className="ml-6 border-l-2 border-border pl-6">
                    <Label htmlFor="delegateAddr" className="text-sm">Delegate Address</Label>
                    <Input
                      id="delegateAddr"
                      type="text"
                      placeholder="Wallet address"
                      className="mt-1"
                      value={extensions.permanentDelegateAddress ?? ''}
                      onChange={(e) => setExtensions({ ...extensions, permanentDelegateAddress: e.target.value })}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Creation Logs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Creation Logs</CardTitle>
            <CardDescription>Preflight, simulation, and submit output</CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setLogs([])}>Clear</Button>
        </CardHeader>
        <CardContent>
          <div className="h-56 overflow-auto rounded bg-surface p-3 text-xs whitespace-pre-wrap">
            {logs.length === 0 ? (
              <span className="text-foreground-muted">No logs yet.</span>
            ) : (
              logs.map((l, i) => <div key={i}>{l}</div>)
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardContent className="flex items-center justify-between py-6">
          <div className="space-y-1">
            <p className="font-medium">Ready to create your token?</p>
            <p className="text-sm text-foreground-muted">
              Deployment will require approximately 0.02 SOL for rent and fees
            </p>
          </div>
          <Button
            size="lg"
            onClick={handleCreateToken}
            disabled={!metadata.name || !metadata.symbol || isCreating}
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Token...
              </>
            ) : (
              <>
                <Coins className="mr-2 h-4 w-4" />
                Create Token
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}


