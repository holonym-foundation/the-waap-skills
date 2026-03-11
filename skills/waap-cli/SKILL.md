---
name: waap-cli
description: Agent instructions for using @human.tech/waap-cli to create wallets, sign messages or typed data, send EVM transactions, and run JSON-RPC wallet requests.
license: MIT
metadata:
  author: human.tech
  version: "1.0.1"
---

# WaaP CLI Skill

Instructions and guidelines for AI agents using `@human.tech/waap-cli` (`waap-cli`) to perform decentralized actions. Using WaaP, agents can securely sign and execute EVM transactions without handling raw private keys.

**Documentation**: For full WaaP platform documentation, SDKs, and advanced integration guides, see [docs.waap.xyz](https://docs.waap.xyz/).

## When to Apply

Use this skill when:

- Instructed to create, signup or login to a WaaP wallet as an agent.
- Instructed to sign a message or transaction as an agent.
- Interacting with an EVM-compatible blockchain.
- Deploying contracts or sending funds.
- Creating a new agent wallet securely.

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

To retrieve the 0x address of the current logged-in agent:

```bash
waap-cli whoami
```

## Signing & Execution Patterns

### Message Signing (EIP-191)

For proving identity or signing off-chain orders:

```bash
waap-cli sign-message --message "I am an autonomous agent."
# Hex messages are also supported
waap-cli sign-message --message 0xdeadbeef
```

### EIP-712 Typed Data

For complex structured signatures (like Permit2 or Seaport):

```bash
waap-cli sign-typed-data --data '{"types":{...},"domain":{...},"primaryType":"Mail","message":{...}}'
```

### Direct Transaction Execution (send-tx)

To both sign and broadcast an EVM transaction in one step:

```bash
# Basic ETH transfer
waap-cli send-tx \
  --to 0xRecipientAddress \
  --value 0.01 \
  --chain-id 1 \
  --rpc https://eth.llamarpc.com

# Interacting with a Smart Contract
waap-cli send-tx \
  --to 0xTokenContract \
  --value 0 \
  --data 0xa9059cbb0000... \
  --chain-id 1 \
  --rpc https://eth.llamarpc.com
```

### Offline / Delegated Signing (sign-tx)

If you need the raw signed transaction hex (to relay via a bundler or specialized endpoint) WITHOUT broadcasting it:

```bash
waap-cli sign-tx --to 0xTarget --value 0.1 --chain-id 8453 --rpc https://mainnet.base.org
```

### EIP-1193 JSON-RPC Interface

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
# -> 2FA Method: EMAIL_AUTHZ, Daily Spend Limit: $100, Min Risk: HighWarn
```

### Set Daily Spend Limit

Agents can lower their own daily spend limit (requires 2FA approval if enabled):

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
waap-cli 2fa enable --wallet 0xHardwareWalletAddress
```

## RPC

For `eth_getBalance`, `send-tx`, and `sign-tx`, RPC can be passed with `--rpc` option flag.
The `waap-cli` auto-selects a free public RPC URL if `--rpc` is not set.

## Error Handling & Troubleshooting

1. **"2FA Required" / "Policy engine rejected"**: The account has 2FA enabled. The user needs to disable 2FA for this wallet, OR provide an encoded permission token to bypass it:
   `waap-cli sign-message --message "Hello" --permission-token <token>`
   To disable 2FA: `waap-cli 2fa disable`
2. **"Not Found" / "Unauthorized"**: The local session might be invalid. Run `waap-cli login` again.
3. **RPC Errors**: Ensure `--rpc` is set to a valid, responsive public RPC endpoint for the requested `--chain-id`.
4. **Hex Format**: Ensure `data` payloads for contracts always start with `0x`.
