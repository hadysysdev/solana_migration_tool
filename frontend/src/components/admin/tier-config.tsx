'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Tier {
  id: number;
  min: number;
  max?: number;
  ratio: number;
}

interface TierConfigProps {
  tiers: Tier[];
  onChange: (tiers: Tier[]) => void;
}

export function TierConfig({ tiers, onChange }: TierConfigProps) {
  const addTier = () => {
    const newId = tiers.length > 0 ? Math.max(...tiers.map((t) => t.id)) + 1 : 1;
    const lastTier = tiers.length > 0 ? tiers[tiers.length - 1] : null;
    const newTier: Tier = {
      id: newId,
      min: lastTier ? (lastTier.max || lastTier.min) : 0,
      max: undefined,
      ratio: 1.0,
    };
    onChange([...tiers, newTier]);
  };

  const removeTier = (id: number) => {
    if (tiers.length <= 1) {
      // Keep at least one tier
      return;
    }
    onChange(tiers.filter((t) => t.id !== id));
  };

  const updateTier = (id: number, updates: Partial<Tier>) => {
    onChange(
      tiers.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  // Ensure at least one tier exists
  if (tiers.length === 0) {
    return (
      <div>
        <Button type="button" onClick={addTier} variant="outline" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Tier
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Tier Configuration</Label>
        <Button type="button" onClick={addTier} variant="outline" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Tier
        </Button>
      </div>

      <div className="space-y-3">
        {tiers.map((tier, index) => (
          <Card key={tier.id} variant="glass" className="p-3">
            <CardContent className="p-0 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Tier {index + 1}</span>
                {tiers.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTier(tier.id)}
                    className="h-7 w-7 p-0 text-danger-400 hover:text-danger-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor={`tier-${tier.id}-min`} className="text-xs">
                    Min Tokens
                  </Label>
                  <Input
                    id={`tier-${tier.id}-min`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={tier.min}
                    onChange={(e) =>
                      updateTier(tier.id, { min: parseFloat(e.target.value) || 0 })
                    }
                    className="h-8 text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor={`tier-${tier.id}-max`} className="text-xs">
                    Max Tokens (optional)
                  </Label>
                  <Input
                    id={`tier-${tier.id}-max`}
                    type="number"
                    min={tier.min}
                    step="0.01"
                    value={tier.max || ''}
                    onChange={(e) =>
                      updateTier(tier.id, {
                        max: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                    placeholder="∞"
                    className="h-8 text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor={`tier-${tier.id}-ratio`} className="text-xs">
                    Ratio (1:X)
                  </Label>
                  <Input
                    id={`tier-${tier.id}-ratio`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={tier.ratio}
                    onChange={(e) =>
                      updateTier(tier.id, { ratio: parseFloat(e.target.value) || 1.0 })
                    }
                    className="h-8 text-sm"
                  />
                </div>
              </div>

              {tier.max !== undefined && tier.max <= tier.min && (
                <p className="text-xs text-warning-400">
                  Max must be greater than min
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-xs text-foreground-muted">
        Tiers are evaluated in order. The first matching tier will be applied. Ratio of 1.0 means
        1:1 exchange rate.
      </p>
    </div>
  );
}

