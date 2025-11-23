/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/w3swap.json`.
 */
export type W3swap = {
  "address": "9qPx5xbqg4xZp3BWbtCNGy3GVfZ4WeaeraMUvLBSdcKh",
  "metadata": {
    "name": "w3swap",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "W3Swap Migration Platform - Secure token migration on Solana with Token-2022 support"
  },
  "docs": [
    "W3Swap Migration Platform",
    "",
    "A secure token migration platform on Solana that enables:",
    "- Secure token swaps with admin controls",
    "- Optional migration protection with SOL commitments",
    "- LP token management and escrow",
    "- Configurable refund mechanisms",
    "- Multi-role access control (Super Admin, Project Admins)"
  ],
  "instructions": [
    {
      "name": "activateProject",
      "docs": [
        "Activate a project for migrations and create initial LP"
      ],
      "discriminator": [
        237,
        96,
        65,
        148,
        226,
        140,
        89,
        15
      ],
      "accounts": [
        {
          "name": "project",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  106,
                  101,
                  99,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "projectAdmin"
              },
              {
                "kind": "account",
                "path": "project.project_id",
                "account": "project"
              }
            ]
          }
        },
        {
          "name": "newTokenVault",
          "writable": true
        },
        {
          "name": "liquidityVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  105,
                  113,
                  117,
                  105,
                  100,
                  105,
                  116,
                  121,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "project"
              }
            ]
          }
        },
        {
          "name": "lpEscrowVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  112,
                  95,
                  101,
                  115,
                  99,
                  114,
                  111,
                  119,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "project"
              }
            ]
          }
        },
        {
          "name": "meteoraPool",
          "writable": true
        },
        {
          "name": "lpMint"
        },
        {
          "name": "newTokenMint"
        },
        {
          "name": "newTokenProgram"
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "projectAdmin",
          "writable": true,
          "signer": true,
          "relations": [
            "project"
          ]
        },
        {
          "name": "meteoraProgram"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "lpConfig",
          "type": {
            "defined": {
              "name": "lpConfiguration"
            }
          }
        }
      ]
    },
    {
      "name": "allocateProjectAccount",
      "docs": [
        "Pre-allocate the project PDA account with full space",
        "Required before create_project_init to avoid 10KB reallocation limit"
      ],
      "discriminator": [
        198,
        123,
        234,
        139,
        136,
        8,
        111,
        13
      ],
      "accounts": [
        {
          "name": "platformConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  108,
                  97,
                  116,
                  102,
                  111,
                  114,
                  109,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "projectAdmin",
          "writable": true,
          "signer": true
        },
        {
          "name": "project",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  106,
                  101,
                  99,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "projectAdmin"
              },
              {
                "kind": "arg",
                "path": "projectId"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "projectId",
          "type": "u64"
        }
      ]
    },
    {
      "name": "closeProjectAccounts",
      "docs": [
        "Finalize project step 2: close remaining accounts and reclaim rent"
      ],
      "discriminator": [
        187,
        23,
        133,
        120,
        247,
        197,
        211,
        55
      ],
      "accounts": [
        {
          "name": "project",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  106,
                  101,
                  99,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "projectAdmin"
              },
              {
                "kind": "account",
                "path": "project.project_id",
                "account": "project"
              }
            ]
          }
        },
        {
          "name": "newTokenVault",
          "writable": true
        },
        {
          "name": "oldTokenVault",
          "writable": true
        },
        {
          "name": "liquidityVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  105,
                  113,
                  117,
                  105,
                  100,
                  105,
                  116,
                  121,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "project"
              }
            ]
          }
        },
        {
          "name": "projectAdmin",
          "writable": true,
          "signer": true,
          "relations": [
            "project"
          ]
        },
        {
          "name": "newTokenProgram",
          "docs": [
            "Token program interfaces (used to close token accounts via CPI)"
          ]
        },
        {
          "name": "oldTokenProgram"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "completeSettlement",
      "docs": [
        "Complete settlement and start LP lockup period"
      ],
      "discriminator": [
        204,
        142,
        168,
        39,
        247,
        27,
        183,
        240
      ],
      "accounts": [
        {
          "name": "project",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  106,
                  101,
                  99,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "projectAdmin"
              },
              {
                "kind": "account",
                "path": "project.project_id",
                "account": "project"
              }
            ]
          }
        },
        {
          "name": "platformConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  108,
                  97,
                  116,
                  102,
                  111,
                  114,
                  109,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "projectAdmin",
          "signer": true,
          "relations": [
            "project"
          ]
        }
      ],
      "args": [
        {
          "name": "totalSolFromSales",
          "type": "u64"
        },
        {
          "name": "lpTokensEscrowed",
          "type": "u64"
        }
      ]
    },
    {
      "name": "allocateProjectAccount",
      "docs": [
        "Pre-allocate the project PDA to avoid Solana's 10KB reallocation limit"
      ],
      "discriminator": [
        198,
        123,
        234,
        139,
        136,
        8,
        111,
        13
      ],
      "accounts": [
        {
          "name": "platformConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  108,
                  97,
                  116,
                  102,
                  111,
                  114,
                  109,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "projectAdmin",
          "signer": true
        },
        {
          "name": "project",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  106,
                  101,
                  99,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "projectAdmin"
              },
              {
                "kind": "arg",
                "path": "projectId"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "projectId",
          "type": "u64"
        }
      ]
    },
    {
      "name": "createProjectInit",
      "docs": [
        "Create project (step 1): initialize account and fields",
        "Note: Must call allocate_project_account first"
      ],
      "discriminator": [
        123,
        100,
        107,
        185,
        23,
        212,
        141,
        162
      ],
      "accounts": [
        {
          "name": "platformConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  108,
                  97,
                  116,
                  102,
                  111,
                  114,
                  109,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "project",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  106,
                  101,
                  99,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "projectAdmin"
              },
              {
                "kind": "arg",
                "path": "params.project_id"
              }
            ]
          }
        },
        {
          "name": "oldTokenMint"
        },
        {
          "name": "newTokenMint"
        },
        {
          "name": "oldTokenProgram"
        },
        {
          "name": "newTokenProgram"
        },
        {
          "name": "projectAdmin",
          "writable": true,
          "signer": true
        },
        {
          "name": "feeDestination",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "createProjectParams"
            }
          }
        }
      ]
    },
    {
      "name": "createProjectVaults",
      "docs": [
        "Create project (step 2): initialize vaults + fund SOL commitment"
      ],
      "discriminator": [
        101,
        10,
        109,
        9,
        146,
        188,
        140,
        61
      ],
      "accounts": [
        {
          "name": "project",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  106,
                  101,
                  99,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "projectAdmin"
              },
              {
                "kind": "account",
                "path": "project.project_id",
                "account": "project"
              }
            ]
          }
        },
        {
          "name": "oldTokenVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  111,
                  108,
                  100,
                  95,
                  116,
                  111,
                  107,
                  101,
                  110,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "project"
              }
            ]
          }
        },
        {
          "name": "newTokenVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  110,
                  101,
                  119,
                  95,
                  116,
                  111,
                  107,
                  101,
                  110,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "project"
              }
            ]
          }
        },
        {
          "name": "liquidityVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  105,
                  113,
                  117,
                  105,
                  100,
                  105,
                  116,
                  121,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "project"
              }
            ]
          }
        },
        {
          "name": "oldTokenMint"
        },
        {
          "name": "newTokenMint"
        },
        {
          "name": "oldTokenProgram"
        },
        {
          "name": "newTokenProgram"
        },
        {
          "name": "projectAdmin",
          "writable": true,
          "signer": true,
          "relations": [
            "project"
          ]
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "depositLp",
      "docs": [
        "Deposit LP tokens to escrow"
      ],
      "discriminator": [
        83,
        107,
        16,
        26,
        26,
        20,
        130,
        56
      ],
      "accounts": [
        {
          "name": "project",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  106,
                  101,
                  99,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "projectAdmin"
              },
              {
                "kind": "account",
                "path": "project.project_id",
                "account": "project"
              }
            ]
          }
        },
        {
          "name": "lpEscrowVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  112,
                  95,
                  101,
                  115,
                  99,
                  114,
                  111,
                  119,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "project"
              }
            ]
          }
        },
        {
          "name": "projectAdminLpAccount",
          "writable": true
        },
        {
          "name": "lpMint"
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "projectAdmin",
          "writable": true,
          "signer": true,
          "relations": [
            "project"
          ]
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "endProject",
      "docs": [
        "End a project migration period"
      ],
      "discriminator": [
        207,
        245,
        19,
        20,
        210,
        197,
        94,
        146
      ],
      "accounts": [
        {
          "name": "project",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  106,
                  101,
                  99,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "projectAdmin"
              },
              {
                "kind": "account",
                "path": "project.project_id",
                "account": "project"
              }
            ]
          }
        },
        {
          "name": "projectAdmin",
          "signer": true,
          "relations": [
            "project"
          ]
        }
      ],
      "args": []
    },
    {
      "name": "executeJupiterSwap",
      "docs": [
        "Execute a Jupiter swap route (mainnet)"
      ],
      "discriminator": [
        0,
        153,
        94,
        101,
        168,
        72,
        220,
        247
      ],
      "accounts": [
        {
          "name": "platformConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  108,
                  97,
                  116,
                  102,
                  111,
                  114,
                  109,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "project",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  106,
                  101,
                  99,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "project.project_admin",
                "account": "project"
              },
              {
                "kind": "account",
                "path": "project.project_id",
                "account": "project"
              }
            ]
          }
        },
        {
          "name": "oldTokenVault",
          "writable": true
        },
        {
          "name": "wsolVault",
          "docs": [
            "WSOL vault to receive proceeds"
          ],
          "writable": true
        },
        {
          "name": "tokenProgram",
          "docs": [
            "Token programs"
          ]
        },
        {
          "name": "routeProgram",
          "docs": [
            "Jupiter program (must be allowlisted)"
          ]
        },
        {
          "name": "payer",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "amountIn",
          "type": "u64"
        },
        {
          "name": "minOutWsol",
          "type": "u64"
        },
        {
          "name": "ixData",
          "type": "bytes"
        }
      ]
    },
    {
      "name": "executeMeteoraSwap",
      "docs": [
        "Execute a Meteora swap route (devnet/testing)"
      ],
      "discriminator": [
        27,
        78,
        56,
        97,
        225,
        40,
        57,
        111
      ],
      "accounts": [
        {
          "name": "platformConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  108,
                  97,
                  116,
                  102,
                  111,
                  114,
                  109,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "project",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  106,
                  101,
                  99,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "project.project_admin",
                "account": "project"
              },
              {
                "kind": "account",
                "path": "project.project_id",
                "account": "project"
              }
            ]
          }
        },
        {
          "name": "oldTokenVault",
          "writable": true
        },
        {
          "name": "wsolVault",
          "docs": [
            "WSOL vault to receive proceeds"
          ],
          "writable": true
        },
        {
          "name": "tokenProgram",
          "docs": [
            "Token programs"
          ]
        },
        {
          "name": "routeProgram",
          "docs": [
            "Route program (must be allowlisted)"
          ]
        },
        {
          "name": "payer",
          "docs": [
            "Payer for any required ATA creations off-chain (not used here but kept for future)"
          ],
          "signer": true
        }
      ],
      "args": [
        {
          "name": "amountIn",
          "type": "u64"
        },
        {
          "name": "minOutWsol",
          "type": "u64"
        },
        {
          "name": "ixData",
          "type": "bytes"
        }
      ]
    },
    {
      "name": "finalizeProjectTransfers",
      "docs": [
        "Finalize project step 1: transfer LP/new tokens out and close LP escrow"
      ],
      "discriminator": [
        65,
        255,
        47,
        195,
        114,
        248,
        154,
        139
      ],
      "accounts": [
        {
          "name": "project",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  106,
                  101,
                  99,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "projectAdmin"
              },
              {
                "kind": "account",
                "path": "project.project_id",
                "account": "project"
              }
            ]
          }
        },
        {
          "name": "lpEscrowVault",
          "writable": true
        },
        {
          "name": "newTokenVault",
          "writable": true
        },
        {
          "name": "oldTokenVault",
          "writable": true
        },
        {
          "name": "adminLpTokenAccount",
          "writable": true
        },
        {
          "name": "adminNewTokenAccount",
          "writable": true
        },
        {
          "name": "lpMint",
          "docs": [
            "LP token mint"
          ]
        },
        {
          "name": "newTokenMint"
        },
        {
          "name": "newTokenProgram"
        },
        {
          "name": "lpTokenProgram"
        },
        {
          "name": "projectAdmin",
          "writable": true,
          "signer": true,
          "relations": [
            "project"
          ]
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "finalizeSettlement",
      "docs": [
        "Finalize settlement: skim fee and add remaining WSOL to LP"
      ],
      "discriminator": [
        220,
        72,
        152,
        119,
        178,
        196,
        25,
        170
      ],
      "accounts": [
        {
          "name": "platformConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  108,
                  97,
                  116,
                  102,
                  111,
                  114,
                  109,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "project",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  106,
                  101,
                  99,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "project.project_admin",
                "account": "project"
              },
              {
                "kind": "account",
                "path": "project.project_id",
                "account": "project"
              }
            ]
          }
        },
        {
          "name": "wsolVault",
          "writable": true
        },
        {
          "name": "lpEscrowVault",
          "docs": [
            "LP escrow vault (receives LP tokens)"
          ],
          "writable": true
        },
        {
          "name": "lpMint",
          "docs": [
            "LP token mint"
          ]
        },
        {
          "name": "wsolMint",
          "docs": [
            "WSOL mint (So111...)"
          ]
        },
        {
          "name": "feeDestinationTokenAccount",
          "docs": [
            "Fee destination WSOL token account (should be ATA of fee_destination_wallet)"
          ],
          "writable": true
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "routeProgram",
          "docs": [
            "Route program for adding liquidity (Meteora)"
          ]
        },
        {
          "name": "payer",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "lpAddIxData",
          "type": "bytes"
        }
      ]
    },
    {
      "name": "fundProject",
      "docs": [
        "Fund a project with new tokens"
      ],
      "discriminator": [
        129,
        115,
        149,
        68,
        159,
        207,
        33,
        149
      ],
      "accounts": [
        {
          "name": "project",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  106,
                  101,
                  99,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "projectAdmin"
              },
              {
                "kind": "account",
                "path": "project.project_id",
                "account": "project"
              }
            ]
          }
        },
        {
          "name": "newTokenVault",
          "writable": true
        },
        {
          "name": "newTokenMint"
        },
        {
          "name": "projectAdminTokenAccount",
          "writable": true
        },
        {
          "name": "projectAdmin",
          "signer": true,
          "relations": [
            "project"
          ]
        },
        {
          "name": "newTokenProgram"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initializePlatform",
      "docs": [
        "Initialize the platform with super admin"
      ],
      "discriminator": [
        119,
        201,
        101,
        45,
        75,
        122,
        89,
        3
      ],
      "accounts": [
        {
          "name": "platformConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  108,
                  97,
                  116,
                  102,
                  111,
                  114,
                  109,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "superAdmin",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "feeDestinationWallet",
          "type": "pubkey"
        },
        {
          "name": "minSolCommitment",
          "type": "u64"
        },
        {
          "name": "autoPauseThresholdPercent",
          "type": "u8"
        }
      ]
    },
    {
      "name": "manageProjectAdmin",
      "docs": [
        "Manage project admin list (add/remove)"
      ],
      "discriminator": [
        135,
        104,
        6,
        76,
        126,
        79,
        202,
        224
      ],
      "accounts": [
        {
          "name": "platformConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  108,
                  97,
                  116,
                  102,
                  111,
                  114,
                  109,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "superAdmin",
          "signer": true,
          "relations": [
            "platformConfig"
          ]
        }
      ],
      "args": [
        {
          "name": "admin",
          "type": "pubkey"
        },
        {
          "name": "action",
          "type": {
            "defined": {
              "name": "adminAction"
            }
          }
        }
      ]
    },
    {
      "name": "markLpCreated",
      "docs": [
        "Mark LP as created"
      ],
      "discriminator": [
        162,
        254,
        123,
        135,
        187,
        136,
        51,
        181
      ],
      "accounts": [
        {
          "name": "project",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  106,
                  101,
                  99,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "projectAdmin"
              },
              {
                "kind": "account",
                "path": "project.project_id",
                "account": "project"
              }
            ]
          }
        },
        {
          "name": "projectAdmin",
          "signer": true,
          "relations": [
            "project"
          ]
        }
      ],
      "args": []
    },
    {
      "name": "migrate",
      "docs": [
        "Migrate old tokens for new tokens"
      ],
      "discriminator": [
        155,
        234,
        231,
        146,
        236,
        158,
        162,
        30
      ],
      "accounts": [
        {
          "name": "project",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  106,
                  101,
                  99,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "project.project_admin",
                "account": "project"
              },
              {
                "kind": "account",
                "path": "project.project_id",
                "account": "project"
              }
            ]
          }
        },
        {
          "name": "userMigration",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114,
                  95,
                  109,
                  105,
                  103,
                  114,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "project"
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "oldTokenVault",
          "writable": true
        },
        {
          "name": "newTokenVault",
          "writable": true
        },
        {
          "name": "userOldTokenAccount",
          "writable": true
        },
        {
          "name": "userNewTokenAccount",
          "writable": true,
          "signer": true
        },
        {
          "name": "oldTokenMint"
        },
        {
          "name": "newTokenMint"
        },
        {
          "name": "oldTokenProgram"
        },
        {
          "name": "newTokenProgram"
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "pauseProject",
      "docs": [
        "Pause a project temporarily"
      ],
      "discriminator": [
        8,
        68,
        240,
        82,
        45,
        162,
        129,
        230
      ],
      "accounts": [
        {
          "name": "project",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  106,
                  101,
                  99,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "projectAdmin"
              },
              {
                "kind": "account",
                "path": "project.project_id",
                "account": "project"
              }
            ]
          }
        },
        {
          "name": "projectAdmin",
          "signer": true,
          "relations": [
            "project"
          ]
        }
      ],
      "args": []
    },
    {
      "name": "resumeProject",
      "docs": [
        "Resume a paused project"
      ],
      "discriminator": [
        11,
        74,
        18,
        128,
        57,
        187,
        127,
        235
      ],
      "accounts": [
        {
          "name": "platformConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  108,
                  97,
                  116,
                  102,
                  111,
                  114,
                  109,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "project",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  106,
                  101,
                  99,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "projectAdmin"
              },
              {
                "kind": "account",
                "path": "project.project_id",
                "account": "project"
              }
            ]
          }
        },
        {
          "name": "newTokenVault"
        },
        {
          "name": "newTokenMint"
        },
        {
          "name": "projectAdmin",
          "signer": true,
          "relations": [
            "project"
          ]
        }
      ],
      "args": []
    },
    {
      "name": "swapOldTokenBatch",
      "docs": [
        "Swap old tokens in batches via Jupiter or Meteora"
      ],
      "discriminator": [
        25,
        229,
        1,
        187,
        131,
        241,
        50,
        77
      ],
      "accounts": [
        {
          "name": "platformConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  108,
                  97,
                  116,
                  102,
                  111,
                  114,
                  109,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "project",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  106,
                  101,
                  99,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "projectAdmin"
              },
              {
                "kind": "account",
                "path": "project.project_id",
                "account": "project"
              }
            ]
          }
        },
        {
          "name": "oldTokenVault",
          "writable": true
        },
        {
          "name": "wsolVault",
          "writable": true
        },
        {
          "name": "oldTokenMint"
        },
        {
          "name": "wsolMint"
        },
        {
          "name": "oldTokenProgram"
        },
        {
          "name": "wsolTokenProgram"
        },
        {
          "name": "projectAdmin",
          "writable": true,
          "signer": true,
          "relations": [
            "project"
          ]
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "backend",
          "type": {
            "defined": {
              "name": "swapBackend"
            }
          }
        },
        {
          "name": "amountIn",
          "type": "u64"
        },
        {
          "name": "minOut",
          "type": "u64"
        },
        {
          "name": "ixData",
          "type": "bytes"
        }
      ]
    },
    {
      "name": "updateFeeDestinationWallet",
      "docs": [
        "Update fee destination wallet"
      ],
      "discriminator": [
        174,
        110,
        188,
        231,
        119,
        170,
        13,
        29
      ],
      "accounts": [
        {
          "name": "platformConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  108,
                  97,
                  116,
                  102,
                  111,
                  114,
                  109,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "superAdmin",
          "signer": true,
          "relations": [
            "platformConfig"
          ]
        }
      ],
      "args": [
        {
          "name": "newFeeDestination",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "updatePlatformConfig",
      "docs": [
        "Update platform configuration"
      ],
      "discriminator": [
        195,
        60,
        76,
        129,
        146,
        45,
        67,
        143
      ],
      "accounts": [
        {
          "name": "platformConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  108,
                  97,
                  116,
                  102,
                  111,
                  114,
                  109,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "superAdmin",
          "signer": true,
          "relations": [
            "platformConfig"
          ]
        }
      ],
      "args": [
        {
          "name": "allowedSwapPrograms",
          "type": {
            "option": {
              "vec": "pubkey"
            }
          }
        },
        {
          "name": "minSolCommitment",
          "type": {
            "option": "u64"
          }
        },
        {
          "name": "autoPauseThresholdPercent",
          "type": {
            "option": "u8"
          }
        },
        {
          "name": "platformFeeSol",
          "type": {
            "option": "u8"
          }
        },
        {
          "name": "settlementFeePercent",
          "type": {
            "option": "u8"
          }
        },
        {
          "name": "minMigrationDays",
          "type": {
            "option": "u8"
          }
        },
        {
          "name": "maxMigrationDays",
          "type": {
            "option": "u8"
          }
        },
        {
          "name": "minLpLockDays",
          "type": {
            "option": "u8"
          }
        }
      ]
    },
    {
      "name": "withdrawLp",
      "docs": [
        "Withdraw LP tokens from escrow"
      ],
      "discriminator": [
        225,
        221,
        45,
        211,
        49,
        60,
        51,
        163
      ],
      "accounts": [
        {
          "name": "project",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  106,
                  101,
                  99,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "projectAdmin"
              },
              {
                "kind": "account",
                "path": "project.project_id",
                "account": "project"
              }
            ]
          }
        },
        {
          "name": "lpEscrowVault",
          "writable": true
        },
        {
          "name": "projectAdminLpAccount",
          "writable": true
        },
        {
          "name": "lpMint"
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "projectAdmin",
          "signer": true,
          "relations": [
            "project"
          ]
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "platformConfig",
      "discriminator": [
        160,
        78,
        128,
        0,
        248,
        83,
        230,
        160
      ]
    },
    {
      "name": "project",
      "discriminator": [
        205,
        168,
        189,
        202,
        181,
        247,
        142,
        19
      ]
    }
  ],
  "events": [
    {
      "name": "feeDestinationWalletUpdated",
      "discriminator": [
        6,
        110,
        8,
        111,
        67,
        164,
        252,
        78
      ]
    },
    {
      "name": "lpCreated",
      "discriminator": [
        20,
        66,
        14,
        136,
        151,
        216,
        6,
        91
      ]
    },
    {
      "name": "lpDeposited",
      "discriminator": [
        85,
        211,
        184,
        159,
        176,
        224,
        28,
        72
      ]
    },
    {
      "name": "lpWithdrawn",
      "discriminator": [
        188,
        10,
        43,
        60,
        223,
        238,
        51,
        153
      ]
    },
    {
      "name": "migrationPerformed",
      "discriminator": [
        115,
        222,
        180,
        59,
        172,
        120,
        185,
        163
      ]
    },
    {
      "name": "oldTokenBatchSwapped",
      "discriminator": [
        12,
        66,
        107,
        101,
        124,
        67,
        154,
        60
      ]
    },
    {
      "name": "oldTokenLiquidationComplete",
      "discriminator": [
        132,
        23,
        32,
        151,
        94,
        71,
        176,
        78
      ]
    },
    {
      "name": "platformConfigUpdated",
      "discriminator": [
        198,
        206,
        187,
        204,
        148,
        251,
        237,
        25
      ]
    },
    {
      "name": "platformInitialized",
      "discriminator": [
        16,
        222,
        212,
        5,
        213,
        140,
        112,
        162
      ]
    },
    {
      "name": "projectAdminManaged",
      "discriminator": [
        61,
        160,
        44,
        137,
        204,
        239,
        166,
        70
      ]
    },
    {
      "name": "projectCreated",
      "discriminator": [
        192,
        10,
        163,
        29,
        185,
        31,
        67,
        168
      ]
    },
    {
      "name": "projectFinalized",
      "discriminator": [
        206,
        140,
        138,
        3,
        23,
        210,
        23,
        204
      ]
    },
    {
      "name": "projectFunded",
      "discriminator": [
        125,
        81,
        242,
        91,
        14,
        66,
        74,
        95
      ]
    },
    {
      "name": "projectStatusChanged",
      "discriminator": [
        61,
        114,
        220,
        188,
        124,
        178,
        129,
        228
      ]
    },
    {
      "name": "settlementCompleted",
      "discriminator": [
        24,
        33,
        148,
        69,
        53,
        1,
        59,
        48
      ]
    },
    {
      "name": "swapExecuted",
      "discriminator": [
        150,
        166,
        26,
        225,
        28,
        89,
        38,
        79
      ]
    },
    {
      "name": "vaultBalanceLow",
      "discriminator": [
        110,
        158,
        117,
        104,
        67,
        94,
        159,
        184
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "notSuperAdmin",
      "msg": "Unauthorized: Not super admin"
    },
    {
      "code": 6001,
      "name": "notProjectAdmin",
      "msg": "Unauthorized: Not project admin"
    },
    {
      "code": 6002,
      "name": "projectAdminListFull",
      "msg": "Project admin list is full"
    },
    {
      "code": 6003,
      "name": "projectAdminNotFound",
      "msg": "Project admin not found"
    },
    {
      "code": 6004,
      "name": "projectAdminAlreadyExists",
      "msg": "Project admin already exists"
    },
    {
      "code": 6005,
      "name": "allowedSwapProgramsListFull",
      "msg": "Allowed swap programs list is full"
    },
    {
      "code": 6006,
      "name": "amountIsZero",
      "msg": "Amount must be greater than zero"
    },
    {
      "code": 6007,
      "name": "arithmeticOverflow",
      "msg": "Arithmetic overflow"
    },
    {
      "code": 6008,
      "name": "invalidInstructionData",
      "msg": "Invalid instruction data provided"
    },
    {
      "code": 6009,
      "name": "invalidTokenProgram",
      "msg": "Invalid token program for the given account"
    },
    {
      "code": 6010,
      "name": "invalidAccountOwner",
      "msg": "Invalid account owner"
    },
    {
      "code": 6011,
      "name": "tokenMintMismatch",
      "msg": "Token mint mismatch"
    },
    {
      "code": 6012,
      "name": "cpiCallFailed",
      "msg": "Cross-program invocation failed"
    },
    {
      "code": 6013,
      "name": "insufficientTokensInVault",
      "msg": "Insufficient tokens available in vault"
    },
    {
      "code": 6014,
      "name": "minimumOutputNotMet",
      "msg": "Minimum output requirement not met"
    },
    {
      "code": 6015,
      "name": "slippageToleranceExceeded",
      "msg": "Slippage tolerance exceeded"
    },
    {
      "code": 6016,
      "name": "invalidMigrationDuration",
      "msg": "Invalid migration duration (must be exactly 30, 60, or 90 days)"
    },
    {
      "code": 6017,
      "name": "invalidMigrationPeriod",
      "msg": "Invalid migration period (start/end timestamps)"
    },
    {
      "code": 6018,
      "name": "invalidExchangeRatio",
      "msg": "Invalid exchange ratio"
    },
    {
      "code": 6019,
      "name": "invalidProtectionPercentage",
      "msg": "Invalid protection percentage (50-100%)"
    },
    {
      "code": 6020,
      "name": "invalidRecoveryDelay",
      "msg": "Invalid recovery delay (7-30 days)"
    },
    {
      "code": 6021,
      "name": "insufficientSolCommitment",
      "msg": "Insufficient SOL commitment for project"
    },
    {
      "code": 6022,
      "name": "insufficientSolForProtection",
      "msg": "Insufficient SOL provided for protection"
    },
    {
      "code": 6023,
      "name": "allowListFull",
      "msg": "Allow list is full"
    },
    {
      "code": 6024,
      "name": "denyListFull",
      "msg": "Deny list is full"
    },
    {
      "code": 6025,
      "name": "specialRatioListFull",
      "msg": "Special ratio list is full"
    },
    {
      "code": 6026,
      "name": "emptySpecialRatioList",
      "msg": "Special ratio list cannot be empty"
    },
    {
      "code": 6027,
      "name": "invalidSpecialRatioConfig",
      "msg": "Invalid special ratio configuration"
    },
    {
      "code": 6028,
      "name": "invalidProjectStatus",
      "msg": "Project not in correct status"
    },
    {
      "code": 6029,
      "name": "migrationNotActive",
      "msg": "Migration not active"
    },
    {
      "code": 6030,
      "name": "migrationPeriodEnded",
      "msg": "Migration period has ended"
    },
    {
      "code": 6031,
      "name": "userNotAllowedToMigrate",
      "msg": "User not allowed to migrate"
    },
    {
      "code": 6032,
      "name": "migrationAlreadyCompleted",
      "msg": "Migration already completed"
    },
    {
      "code": 6033,
      "name": "migrationExpired",
      "msg": "Migration expired"
    },
    {
      "code": 6034,
      "name": "invalidMigrationAmount",
      "msg": "Invalid migration amount"
    },
    {
      "code": 6035,
      "name": "insufficientTokenBalance",
      "msg": "Insufficient token balance for migration"
    },
    {
      "code": 6036,
      "name": "newTokenAccountNotProvided",
      "msg": "New token account not provided"
    },
    {
      "code": 6037,
      "name": "oldTokenAccountNotProvided",
      "msg": "Old token account not provided"
    },
    {
      "code": 6038,
      "name": "invalidTokenAccountOwner",
      "msg": "Invalid token account owner"
    },
    {
      "code": 6039,
      "name": "tokenAccountFrozen",
      "msg": "Token account is frozen"
    },
    {
      "code": 6040,
      "name": "invalidExchangeRate",
      "msg": "Invalid exchange rate"
    },
    {
      "code": 6041,
      "name": "exchangeRateAlreadySet",
      "msg": "Exchange rate already set"
    },
    {
      "code": 6042,
      "name": "exchangeRateNotSet",
      "msg": "Exchange rate not set"
    },
    {
      "code": 6043,
      "name": "invalidLpCreationDeadline",
      "msg": "Invalid LP creation deadline (1-30 days)"
    },
    {
      "code": 6044,
      "name": "lpAlreadyCreated",
      "msg": "LP already created"
    },
    {
      "code": 6045,
      "name": "lpNotCreated",
      "msg": "LP not created yet"
    },
    {
      "code": 6046,
      "name": "lpStillLocked",
      "msg": "LP tokens are still locked"
    },
    {
      "code": 6047,
      "name": "lockupPeriodNotEnded",
      "msg": "Lockup period has not ended"
    },
    {
      "code": 6048,
      "name": "projectNotFunded",
      "msg": "Project not funded"
    },
    {
      "code": 6049,
      "name": "projectNotReady",
      "msg": "Project cannot be activated before start time"
    },
    {
      "code": 6050,
      "name": "invalidThresholdPercent",
      "msg": "Invalid auto-pause threshold percentage"
    },
    {
      "code": 6051,
      "name": "invalidSolCommitment",
      "msg": "Invalid SOL commitment amount"
    },
    {
      "code": 6052,
      "name": "insufficientVaultBalanceToResume",
      "msg": "Vault balance too low to resume - please top up vault"
    },
    {
      "code": 6053,
      "name": "invalidRouteAccount",
      "msg": "Invalid route account structure"
    },
    {
      "code": 6054,
      "name": "routeExceedsMaxHops",
      "msg": "Route exceeds maximum hop count"
    },
    {
      "code": 6055,
      "name": "insufficientComputeBudget",
      "msg": "Insufficient compute budget for route"
    },
    {
      "code": 6056,
      "name": "invalidJupiterProgramState",
      "msg": "Invalid Jupiter program state"
    },
    {
      "code": 6057,
      "name": "invalidMeteoraPoolConfig",
      "msg": "Invalid Meteora pool configuration"
    },
    {
      "code": 6058,
      "name": "liquidationNotAllowed",
      "msg": "Liquidation not allowed - project not in correct status"
    },
    {
      "code": 6059,
      "name": "liquidationInProgress",
      "msg": "Liquidation already in progress - reentrancy not allowed"
    },
    {
      "code": 6060,
      "name": "noOldTokensRemaining",
      "msg": "No old tokens remaining to liquidate"
    },
    {
      "code": 6061,
      "name": "invalidSwapBackend",
      "msg": "Invalid swap backend specified"
    },
    {
      "code": 6062,
      "name": "liquidationAlreadyCompleted",
      "msg": "Liquidation already completed"
    },
    {
      "code": 6063,
      "name": "invalidLiquidationAccounts",
      "msg": "Invalid remaining accounts for liquidation"
    },
    {
      "code": 6064,
      "name": "liquidationAmountExceedsBalance",
      "msg": "Liquidation amount exceeds available balance"
    },
    {
      "code": 6065,
      "name": "liquidationSlippageExceeded",
      "msg": "Slippage protection triggered during liquidation"
    },
    {
      "code": 6066,
      "name": "invalidLiquidationAccountConfig",
      "msg": "Invalid liquidation account configuration"
    },
    {
      "code": 6067,
      "name": "programNotAllowedForRoutes",
      "msg": "Program not allowed for routing operations"
    },
    {
      "code": 6068,
      "name": "userMigrationAlreadyInitialized",
      "msg": "User migration account already initialized"
    },
    {
      "code": 6069,
      "name": "userMigrationAccountMismatch",
      "msg": "User migration account does not match expected project or user"
    },
    {
      "code": 6070,
      "name": "projectAlreadyAllocated",
      "msg": "Project account already allocated"
    }
  ],
  "types": [
    {
      "name": "adminAction",
      "docs": [
        "Admin action for managing project admins"
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "add"
          },
          {
            "name": "remove"
          }
        ]
      }
    },
    {
      "name": "createProjectParams",
      "docs": [
        "Parameters for creating a new project"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "projectId",
            "docs": [
              "Unique project identifier"
            ],
            "type": "u64"
          },
          {
            "name": "projectName",
            "docs": [
              "Project display name"
            ],
            "type": "string"
          },
          {
            "name": "oldTokenMint",
            "docs": [
              "Old token mint to migrate from"
            ],
            "type": "pubkey"
          },
          {
            "name": "newTokenMint",
            "docs": [
              "New token mint to migrate to"
            ],
            "type": "pubkey"
          },
          {
            "name": "oldTokenProgram",
            "docs": [
              "Token program for old token"
            ],
            "type": "pubkey"
          },
          {
            "name": "newTokenProgram",
            "docs": [
              "Token program for new token"
            ],
            "type": "pubkey"
          },
          {
            "name": "migrationStart",
            "docs": [
              "Migration start timestamp"
            ],
            "type": "i64"
          },
          {
            "name": "migrationEnd",
            "docs": [
              "Migration end timestamp"
            ],
            "type": "i64"
          },
          {
            "name": "exchangeRatioNumerator",
            "docs": [
              "Exchange ratio numerator (0 for 1:1)"
            ],
            "type": "u64"
          },
          {
            "name": "exchangeRatioDenominator",
            "docs": [
              "Exchange ratio denominator (0 for 1:1)"
            ],
            "type": "u64"
          },
          {
            "name": "solCommitmentAmount",
            "docs": [
              "SOL commitment amount for LP creation (in lamports)"
            ],
            "type": "u64"
          },
          {
            "name": "specialRatioEnabled",
            "docs": [
              "Enable special ratio for certain wallets"
            ],
            "type": "bool"
          },
          {
            "name": "specialRatioWallets",
            "docs": [
              "Wallets that get special exchange ratio"
            ],
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "allowlistEnabled",
            "docs": [
              "Enable allow list"
            ],
            "type": "bool"
          },
          {
            "name": "denylistEnabled",
            "docs": [
              "Enable deny list"
            ],
            "type": "bool"
          },
          {
            "name": "allowlist",
            "docs": [
              "Allow list entries"
            ],
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "denylist",
            "docs": [
              "Deny list entries"
            ],
            "type": {
              "vec": "pubkey"
            }
          }
        ]
      }
    },
    {
      "name": "feeDestinationWalletUpdated",
      "docs": [
        "Fee destination wallet updated event"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "superAdmin",
            "type": "pubkey"
          },
          {
            "name": "oldFeeDestination",
            "type": "pubkey"
          },
          {
            "name": "newFeeDestination",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "lpConfiguration",
      "docs": [
        "LP Configuration for initial liquidity creation"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "initialPrice",
            "docs": [
              "Initial price for new token (in SOL per token)"
            ],
            "type": "u64"
          },
          {
            "name": "tokenAllocation",
            "docs": [
              "Amount of new tokens to allocate for LP"
            ],
            "type": "u64"
          },
          {
            "name": "binStep",
            "docs": [
              "Meteora bin step (price precision in basis points)"
            ],
            "type": "u16"
          },
          {
            "name": "baseFee",
            "docs": [
              "Base trading fee in basis points"
            ],
            "type": "u16"
          },
          {
            "name": "priceRangeMin",
            "docs": [
              "Price range for concentrated liquidity"
            ],
            "type": "u64"
          },
          {
            "name": "priceRangeMax",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "lpCreated",
      "docs": [
        "LP created event"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "projectId",
            "type": "u64"
          },
          {
            "name": "projectAdmin",
            "type": "pubkey"
          },
          {
            "name": "projectPda",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "lpDeposited",
      "docs": [
        "LP deposited event"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "projectId",
            "type": "u64"
          },
          {
            "name": "projectAdmin",
            "type": "pubkey"
          },
          {
            "name": "projectPda",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "totalDeposited",
            "type": "u64"
          },
          {
            "name": "lockEndTimestamp",
            "type": "i64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "lpWithdrawn",
      "docs": [
        "LP withdrawn event"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "projectId",
            "type": "u64"
          },
          {
            "name": "projectAdmin",
            "type": "pubkey"
          },
          {
            "name": "projectPda",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "remainingDeposited",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "migrationPerformed",
      "docs": [
        "Migration performed event.",
        "",
        "Amount fields are derived from on-chain state and therefore publicly disclose migration flow",
        "totals. Operators concerned about business-sensitive metrics should account for that",
        "transparency when configuring migrations."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "projectId",
            "type": "u64"
          },
          {
            "name": "projectPda",
            "type": "pubkey"
          },
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "oldTokensAmount",
            "type": "u64"
          },
          {
            "name": "newTokensAmount",
            "type": "u64"
          },
          {
            "name": "totalOldMigrated",
            "type": "u64"
          },
          {
            "name": "totalNewDistributed",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "oldTokenBatchSwapped",
      "docs": [
        "Old token batch swap executed during liquidation.",
        "",
        "Amount fields log observed vault deltas on-chain, so liquidation throughput and inventory levels",
        "are inherently public when this event is emitted."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "projectId",
            "type": "u64"
          },
          {
            "name": "projectPda",
            "type": "pubkey"
          },
          {
            "name": "backend",
            "type": "string"
          },
          {
            "name": "amountIn",
            "docs": [
              "Actual old-token balance delta observed in the vault (handles fee-on-transfer tokens)"
            ],
            "type": "u64"
          },
          {
            "name": "amountOut",
            "docs": [
              "Actual WSOL balance delta observed in the vault (post-fee amount received)"
            ],
            "type": "u64"
          },
          {
            "name": "remainingBalance",
            "type": "u64"
          },
          {
            "name": "slot",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "oldTokenLiquidationComplete",
      "docs": [
        "Old token liquidation completed.",
        "",
        "The totals emitted here are calculated from on-chain balances, revealing liquidation outcomes",
        "to the broader network; plan accordingly if this data is considered sensitive."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "projectId",
            "type": "u64"
          },
          {
            "name": "projectPda",
            "type": "pubkey"
          },
          {
            "name": "totalOldSold",
            "type": "u64"
          },
          {
            "name": "totalWsolReceived",
            "type": "u64"
          },
          {
            "name": "backend",
            "type": "string"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "platformConfig",
      "docs": [
        "Platform configuration PDA",
        "Seeds: [\"platform_config\"]"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "superAdmin",
            "docs": [
              "Super admin who can manage everything"
            ],
            "type": "pubkey"
          },
          {
            "name": "projectAdmins",
            "docs": [
              "List of project admins who can create projects"
            ],
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "feeDestinationWallet",
            "docs": [
              "Wallet to receive platform fees"
            ],
            "type": "pubkey"
          },
          {
            "name": "allowedSwapPrograms",
            "docs": [
              "Programs allowed for finalization routes"
            ],
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "minSolCommitment",
            "docs": [
              "Minimum SOL commitment required for LP creation (in lamports)"
            ],
            "type": "u64"
          },
          {
            "name": "autoPauseThresholdPercent",
            "docs": [
              "Auto-pause threshold percentage (e.g., 10 = 10% of one token)"
            ],
            "type": "u8"
          },
          {
            "name": "platformFeeLamports",
            "docs": [
              "Platform fee charged (in lamports). Configured via a simple SOL integer input",
              "and converted to lamports on-chain."
            ],
            "type": "u64"
          },
          {
            "name": "settlementFeePercent",
            "docs": [
              "Settlement fee in whole percent (0-100). For example, 1 = 1%."
            ],
            "type": "u8"
          },
          {
            "name": "minMigrationDays",
            "docs": [
              "Minimum migration duration in days (simple input)"
            ],
            "type": "u8"
          },
          {
            "name": "maxMigrationDays",
            "docs": [
              "Maximum migration duration in days (simple input)"
            ],
            "type": "u8"
          },
          {
            "name": "minLpLockDays",
            "docs": [
              "Minimum LP lock duration in days (simple input)"
            ],
            "type": "u8"
          },
          {
            "name": "bump",
            "docs": [
              "Bump seed for PDA derivation"
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "platformConfigUpdated",
      "docs": [
        "Platform config updated event"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "superAdmin",
            "type": "pubkey"
          },
          {
            "name": "allowedSwapProgramsCount",
            "type": "u8"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "platformInitialized",
      "docs": [
        "Platform initialized event"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "superAdmin",
            "type": "pubkey"
          },
          {
            "name": "feeDestinationWallet",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "project",
      "docs": [
        "Migration project PDA",
        "Seeds: [\"project\", project_admin.key(), project_id]"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "projectId",
            "docs": [
              "Unique project identifier"
            ],
            "type": "u64"
          },
          {
            "name": "projectAdmin",
            "docs": [
              "Admin who created and manages this project"
            ],
            "type": "pubkey"
          },
          {
            "name": "oldTokenMint",
            "docs": [
              "Old token mint to migrate from"
            ],
            "type": "pubkey"
          },
          {
            "name": "newTokenMint",
            "docs": [
              "New token mint to migrate to"
            ],
            "type": "pubkey"
          },
          {
            "name": "oldTokenProgram",
            "docs": [
              "Token program for old token (SPL or Token-2022)"
            ],
            "type": "pubkey"
          },
          {
            "name": "newTokenProgram",
            "docs": [
              "Token program for new token (SPL or Token-2022)"
            ],
            "type": "pubkey"
          },
          {
            "name": "oldTokenVault",
            "docs": [
              "Vault holding old tokens"
            ],
            "type": "pubkey"
          },
          {
            "name": "newTokenVault",
            "docs": [
              "Vault holding new tokens for distribution"
            ],
            "type": "pubkey"
          },
          {
            "name": "liquidityVault",
            "docs": [
              "Vault holding SOL/WSOL commitment for LP"
            ],
            "type": "pubkey"
          },
          {
            "name": "wsolVault",
            "docs": [
              "Vault holding WSOL proceeds from swaps"
            ],
            "type": "pubkey"
          },
          {
            "name": "lpEscrowVault",
            "docs": [
              "LP token escrow vault"
            ],
            "type": "pubkey"
          },
          {
            "name": "status",
            "docs": [
              "Current project status"
            ],
            "type": {
              "defined": {
                "name": "projectStatus"
              }
            }
          },
          {
            "name": "migrationStart",
            "docs": [
              "Migration start timestamp"
            ],
            "type": "i64"
          },
          {
            "name": "migrationEnd",
            "docs": [
              "Migration end timestamp (dynamically calculated)"
            ],
            "type": "i64"
          },
          {
            "name": "migrationDuration",
            "docs": [
              "Migration duration in seconds (as specified by admin)"
            ],
            "type": "i64"
          },
          {
            "name": "totalPauseDuration",
            "docs": [
              "Total pause duration in seconds (accumulated)"
            ],
            "type": "i64"
          },
          {
            "name": "lastPauseStart",
            "docs": [
              "Last pause timestamp (0 if not paused)"
            ],
            "type": "i64"
          },
          {
            "name": "activatedAt",
            "docs": [
              "Actual activation timestamp (when project became active)"
            ],
            "type": "i64"
          },
          {
            "name": "exchangeRatioNumerator",
            "docs": [
              "Exchange ratio numerator (0 = 1:1 ratio)"
            ],
            "type": "u64"
          },
          {
            "name": "exchangeRatioDenominator",
            "docs": [
              "Exchange ratio denominator (0 = 1:1 ratio)"
            ],
            "type": "u64"
          },
          {
            "name": "autoPauseThresholdPercent",
            "docs": [
              "Auto-pause threshold percent copied from platform at creation"
            ],
            "type": "u8"
          },
          {
            "name": "projectName",
            "docs": [
              "Project display name"
            ],
            "type": "string"
          },
          {
            "name": "totalOldMigrated",
            "docs": [
              "Total old tokens migrated"
            ],
            "type": "u64"
          },
          {
            "name": "totalNewDistributed",
            "docs": [
              "Total new tokens distributed"
            ],
            "type": "u64"
          },
          {
            "name": "totalSolCommitted",
            "docs": [
              "Total SOL committed for protection"
            ],
            "type": "u64"
          },
          {
            "name": "lpCreated",
            "docs": [
              "LP created flag"
            ],
            "type": "bool"
          },
          {
            "name": "lpTokensDeposited",
            "docs": [
              "LP tokens deposited to escrow"
            ],
            "type": "u64"
          },
          {
            "name": "lpLockEnd",
            "docs": [
              "LP lock end timestamp"
            ],
            "type": "i64"
          },
          {
            "name": "meteoraPool",
            "docs": [
              "Meteora LP pool address (created at activation)"
            ],
            "type": "pubkey"
          },
          {
            "name": "lpConfig",
            "docs": [
              "LP configuration used for pool creation"
            ],
            "type": {
              "option": {
                "defined": {
                  "name": "lpConfiguration"
                }
              }
            }
          },
          {
            "name": "specialRatioEnabled",
            "docs": [
              "Special ratio enabled for certain wallets"
            ],
            "type": "bool"
          },
          {
            "name": "specialRatioWallets",
            "docs": [
              "Special ratio wallets (who get special exchange rate)"
            ],
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "allowlistEnabled",
            "docs": [
              "Allow list enabled"
            ],
            "type": "bool"
          },
          {
            "name": "denylistEnabled",
            "docs": [
              "Deny list enabled"
            ],
            "type": "bool"
          },
          {
            "name": "allowlist",
            "docs": [
              "Allow list entries (only allocated if enabled)"
            ],
            "type": {
              "option": {
                "vec": "pubkey"
              }
            }
          },
          {
            "name": "denylist",
            "docs": [
              "Deny list entries (only allocated if enabled)"
            ],
            "type": {
              "option": {
                "vec": "pubkey"
              }
            }
          },
          {
            "name": "totalOldSold",
            "docs": [
              "Total old tokens sold during liquidation"
            ],
            "type": "u64"
          },
          {
            "name": "totalWsolReceived",
            "docs": [
              "Total WSOL received from liquidation"
            ],
            "type": "u64"
          },
          {
            "name": "liquidationBackend",
            "docs": [
              "Liquidation backend being used"
            ],
            "type": {
              "option": {
                "defined": {
                  "name": "swapBackend"
                }
              }
            }
          },
          {
            "name": "lastLiquidationSlot",
            "docs": [
              "Last slot where liquidation was processed"
            ],
            "type": "u64"
          },
          {
            "name": "liquidationInProgress",
            "docs": [
              "Flag to prevent reentrant liquidation calls"
            ],
            "type": "bool"
          },
          {
            "name": "bump",
            "docs": [
              "Bump seed for PDA derivation"
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "projectAdminManaged",
      "docs": [
        "Project admin managed event"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "superAdmin",
            "type": "pubkey"
          },
          {
            "name": "admin",
            "type": "pubkey"
          },
          {
            "name": "action",
            "type": "string"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "projectCreated",
      "docs": [
        "Project created event"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "projectId",
            "type": "u64"
          },
          {
            "name": "projectAdmin",
            "type": "pubkey"
          },
          {
            "name": "projectPda",
            "type": "pubkey"
          },
          {
            "name": "oldTokenMint",
            "type": "pubkey"
          },
          {
            "name": "newTokenMint",
            "type": "pubkey"
          },
          {
            "name": "migrationDuration",
            "type": "i64"
          },
          {
            "name": "allowlistEnabled",
            "type": "bool"
          },
          {
            "name": "denylistEnabled",
            "type": "bool"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "projectFinalized",
      "docs": [
        "Project finalized event (after lockup - admin claims LP tokens)"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "projectId",
            "type": "u64"
          },
          {
            "name": "projectAdmin",
            "type": "pubkey"
          },
          {
            "name": "projectPda",
            "type": "pubkey"
          },
          {
            "name": "lpTokensClaimed",
            "type": "u64"
          },
          {
            "name": "newTokensClaimed",
            "type": "u64"
          },
          {
            "name": "rentReclaimed",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "projectFunded",
      "docs": [
        "Project funded event"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "projectId",
            "type": "u64"
          },
          {
            "name": "projectAdmin",
            "type": "pubkey"
          },
          {
            "name": "projectPda",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "totalFunded",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "projectStatus",
      "docs": [
        "Project status enumeration"
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "created"
          },
          {
            "name": "funded"
          },
          {
            "name": "active"
          },
          {
            "name": "paused"
          },
          {
            "name": "ended"
          },
          {
            "name": "migrated"
          },
          {
            "name": "liquidating"
          },
          {
            "name": "liquidationComplete"
          },
          {
            "name": "finalized"
          }
        ]
      }
    },
    {
      "name": "projectStatusChanged",
      "docs": [
        "Project status changed event"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "projectId",
            "type": "u64"
          },
          {
            "name": "projectAdmin",
            "type": "pubkey"
          },
          {
            "name": "projectPda",
            "type": "pubkey"
          },
          {
            "name": "oldStatus",
            "type": {
              "defined": {
                "name": "projectStatus"
              }
            }
          },
          {
            "name": "newStatus",
            "type": {
              "defined": {
                "name": "projectStatus"
              }
            }
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "settlementCompleted",
      "docs": [
        "Settlement completed event (LP created and lockup starts).",
        "",
        "Settlement amounts originate from on-chain balances and are globally visible, which may reveal",
        "revenue or treasury performance metrics to observers."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "projectId",
            "type": "u64"
          },
          {
            "name": "projectAdmin",
            "type": "pubkey"
          },
          {
            "name": "projectPda",
            "type": "pubkey"
          },
          {
            "name": "totalSolFromSales",
            "type": "u64"
          },
          {
            "name": "lpTokensEscrowed",
            "type": "u64"
          },
          {
            "name": "lockupStartsAt",
            "type": "i64"
          },
          {
            "name": "lockupEndsAt",
            "type": "i64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "swapBackend",
      "docs": [
        "Swap backend selection for liquidation"
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "meteora"
          },
          {
            "name": "jupiter"
          }
        ]
      }
    },
    {
      "name": "swapExecuted",
      "docs": [
        "Swap executed via adapter (Jupiter/Meteora).",
        "",
        "Route and amount fields expose precise trading flow on-chain; treat them as public diagnostics",
        "rather than private accounting data."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "projectId",
            "type": "u64"
          },
          {
            "name": "projectPda",
            "type": "pubkey"
          },
          {
            "name": "routeProgram",
            "type": "pubkey"
          },
          {
            "name": "amountIn",
            "type": "u64"
          },
          {
            "name": "minOutWsol",
            "type": "u64"
          },
          {
            "name": "amountOutWsol",
            "type": "u64"
          },
          {
            "name": "wsolBalanceAfter",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "vaultBalanceLow",
      "docs": [
        "Vault balance low event (triggers auto-pause)"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "projectId",
            "type": "u64"
          },
          {
            "name": "projectAdmin",
            "type": "pubkey"
          },
          {
            "name": "projectPda",
            "type": "pubkey"
          },
          {
            "name": "remainingBalance",
            "type": "u64"
          },
          {
            "name": "requiredAmount",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    }
  ]
};
