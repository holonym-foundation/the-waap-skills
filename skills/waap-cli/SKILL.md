---
name: waap-cli
description: Agentic instructions for using the WaaP wallet CLI (waap-cli). Triggers on tasks involving web3 wallet creation, signing messages, signing typed data, interacting with EVM contracts, sending EVM or Sui transactions, transferring SUI, or checking balances using waap-cli.
license: MIT
metadata:
  author: human.tech
  version: '2.0.0'
---

# WaaP CLI Skill

Instructions and guidelines for AI agents using `@human.tech/waap-cli` (`waap-cli`) to perform decentralized actions. Using WaaP, agents can securely sign and execute transactions on **EVM** and **Sui** chains without handling raw private keys.

**Documentation**: For full WaaP platform documentation, SDKs, and advanced integration guides, see [docs.waap.xyz](https://docs.waap.xyz/).

## When to Apply

Use this skill when:

- Instructed to create, signup or login to a WaaP wallet as an agent.
- Instructed to sign a message or transaction as an agent.
- Interacting with an EVM-compatible blockchain (Ethereum, Base, Polygon, Arbitrum, etc.).
- Interacting with the Sui blockchain (mainnet, testnet, devnet).
- Deploying contracts, sending funds, or transferring tokens on EVM or Sui.
- Creating a new agent wallet securely.

## Supported Chains

waap-cli supports two chain families, specified via the `--chain` flag:

- **EVM**: `evm:<chainId>` (e.g., `evm:1`, `evm:8453`) or just the chain ID number (e.g., `1`)
- **Sui**: `sui:<network>` (e.g., `sui:mainnet`, `sui:testnet`, `sui:devnet`, `sui:localnet`)

Set a default chain to avoid passing `--chain` every time:

```bash
waap-cli chain set evm:1 --rpc https://eth.llamarpc.com
waap-cli chain set sui:mainnet
waap-cli chain get   # show current default
```

## Agent-Friendly Output

`waap-cli` is optimized for autonomous agents. It routes all progress info (like "Loading keyshare...") to `stderr`, keeping `stdout` reserved exclusively for data.

### Structured Key-Value (Default)

By default, results are printed as strict `Key: Value` mappings on `stdout`.

```bash
waap-cli whoami
# stdout:
# EvmWalletAddress: 0x61C6...
# SuiWalletAddress: 0xa687...
```

### JSON Mode (`--json`)

For programmatic parsing, use the global `--json` flag to return a clean JSON object on `stdout`.

```bash
waap-cli whoami --json
# { "evmWalletAddress": "0x61C6...", "suiWalletAddress": "0xa687..." }
```

_Note: In JSON mode, even errors are returned as structured JSON: `{"error": "message"}`._

## Agent Wallet Lifecycle

### 1. Account Creation & Login

To create a new wallet for yourself:

```bash
waap-cli signup --email "youremail+agent007@example.com" --password "StrongPass123!" --name "My Agent"
```

_Note: Newly created accounts automatically have 2FA disabled, permitting autonomous agent signing._

To log into an existing account (saves a local session to `~/.waap-cli/session.json`):

```bash
waap-cli login --email "youremail+agent007@example.com" --password "StrongPass123!"
```

### 2. Checking Wallet Address

To retrieve the addresses of the current logged-in agent (shows both EVM and Sui addresses):

```bash
waap-cli whoami
```

## Signing & Execution Patterns

### Message Signing

For proving identity or signing off-chain orders.

**EVM (EIP-191):**

```bash
waap-cli sign-message --message "I am an autonomous agent."
waap-cli sign-message --message 0xdeadbeef
```

**Sui (Blake2b):**

```bash
waap-cli sign-message --message "Hello Sui" --chain sui:mainnet
```

### EIP-712 Typed Data (EVM only)

For complex structured signatures (like Permit2 or Seaport):

```bash
waap-cli sign-typed-data --data '{"types":{...},"domain":{...},"primaryType":"Mail","message":{...}}'
```

### Direct Transaction Execution (send-tx)

To sign and broadcast a transaction in one step.

**EVM:**

```bash
# Basic ETH transfer
waap-cli send-tx \
  --to 0xRecipientAddress \
  --value 0.01 \
  --chain evm:1 \
  --rpc https://eth.llamarpc.com

# Smart contract interaction (--value defaults to 0 if omitted)
waap-cli send-tx \
  --to 0xTokenContract \
  --data 0xa9059cbb0000... \
  --chain evm:1 \
  --rpc https://eth.llamarpc.com
```

**Sui:**

```bash
# Simple SUI transfer (value in MIST)
waap-cli send-tx \
  --to 0xRecipientSuiAddress \
  --value 1000 \
  --chain sui:mainnet

# Pre-built BCS-encoded transaction bytes (Programmable Transaction Blocks)
# You can generate this using the official MystenLabs `sui` CLI:
RAW_TX_BYTES=$(sui client ptb \
  --assign coin @gas \
  --transfer-objects "[coin]" 0xRecipientSuiAddress \
  --serialize-unsigned-transaction)

waap-cli send-tx \
  --tx-bytes "$RAW_TX_BYTES" \
  --chain sui:mainnet

# JSON-serialized TransactionBlock
waap-cli send-tx \
  --tx-json '<json-string>' \
  --chain sui:testnet
```

### Offline / Delegated Signing (sign-tx)

If you need the raw signed transaction (to relay via a bundler or specialized endpoint) WITHOUT broadcasting it.

**EVM:**

```bash
# Provide --value if sending ETH, otherwise it defaults to 0
waap-cli sign-tx --to 0xTarget --value 0.1 --chain evm:8453 --rpc https://mainnet.base.org
waap-cli sign-tx --to 0xTokenContract --data 0x123... --chain evm:1
```

**Sui:**

```bash
# Simple transfer
waap-cli sign-tx --to 0xTarget --value 1000 --chain sui:mainnet

# Pre-built transaction bytes (e.g., from PTB `sui client ptb ... --serialize-unsigned-transaction`)
waap-cli sign-tx --tx-bytes <base64-bcs-bytes> --chain sui:testnet

# JSON-serialized TransactionBlock
waap-cli sign-tx --tx-json '<json-string>' --chain sui:devnet
```

### EIP-1193 JSON-RPC Interface (EVM only)

For generic RPC queries, wrapped with wallet authentication if needed:

```bash
# Fetch ETH balance
waap-cli request eth_getBalance '["0xYourAddress", "latest"]' --chain-id 1 --rpc https://eth.llamarpc.com

# Get current Chain ID
waap-cli request eth_chainId
```

## Policy & 2FA Management

### View Current Policy

```bash
waap-cli policy get
# → 2FA Method: EMAIL_AUTHZ, Daily Spend Limit: $100, Min Risk: HighWarn
```

### Set Daily Spend Limit

Agents can adjust their daily spend limit (requires 2FA approval if enabled):

```bash
waap-cli policy set --daily-spend-limit 500
```

Valid range: 0-10,000 USD.

### 2FA Management

```bash
# View current 2FA method
waap-cli 2fa status

# Disable 2FA (allows autonomous agent signing)
waap-cli 2fa disable

# Enable 2FA (recommended for human-controlled wallets)
waap-cli 2fa enable --email agent@example.com
waap-cli 2fa enable --phone "+1234567890"
waap-cli 2fa enable --telegram 7381029636
waap-cli 2fa enable --wallet 0xHardwareWalletAddress
```

## RPC

**EVM:** RPC can be passed with `--rpc`. The CLI auto-selects a free public RPC if not set.

**Sui:** The CLI uses `@mysten/sui`'s `getFullnodeUrl()` by default based on the network. Custom RPC can be set via `--rpc` or `chain set`.

## Key Differences: EVM vs Sui

| Feature          | EVM                                                 | Sui                                               |
| ---------------- | --------------------------------------------------- | ------------------------------------------------- |
| Chain flag       | `evm:<chainId>` or just `<chainId>`                 | `sui:<network>`                                   |
| Value unit       | ETH (e.g., `0.01`)                                  | MIST (e.g., `1000`)                               |
| Tx input options | `--to`, `--data` (optional `--value` defaults to 0) | `--to`/`--value`, OR `--tx-bytes`, OR `--tx-json` |
| Signature format | Hex                                                 | Base64                                            |
| Typed data       | `sign-typed-data` (EIP-712)                         | N/A                                               |
| Legacy tx flag   | `--legacy`                                          | N/A                                               |

## Error Handling & Troubleshooting

1. **"2FA Required" / "Policy engine rejected"**: The account has 2FA enabled. The user needs to disable 2FA for this wallet, OR provide you with an encoded Privilege to bypass it:
   `waap-cli sign-message --message "Hello" --privilege <token>`
   (`--permission-token` is also accepted as a deprecated alias.)
   To disable 2FA: `waap-cli 2fa disable`
2. **"Not Found" / "Unauthorized"**: The local session might be invalid. Run `waap-cli login` again.
3. **RPC Errors**: Ensure `--rpc` is set to a valid, responsive endpoint for the requested chain.
4. **Hex Format**: Ensure `data` payloads for EVM contracts always start with `0x`.
5. **Sui value unit**: Sui `--value` is in MIST (1 SUI = 1,000,000,000 MIST), not SUI.
