---
name: agent-wallet
description: "Operate a wallet on the human.tech Wallet Protocol from an agent, through the `waap-cli` command line: sign in by email, check balances, and send transactions on EVM, Solana and Sui. The agent's environment never holds a raw private key. Use when the user wants an agent to have its own wallet, mentions waap-cli, agent wallet, wallet login or signup, checking an address or balance, sending ETH, SOL, SUI or USDC, or asks how an agent can transact without being handed a seed phrase."
license: MIT
metadata:
  author: human.tech
  version: "1.0.0"
---

# Agent wallet

The front door. Get an agent a working wallet, then send from it.

Install once:

```bash
npm i -g @human.tech/waap-cli
```

## Set up the account

Ask for the email first; both commands need it.

```bash
waap-cli signup            # new account: email plus a code; --resume continues an interrupted run
waap-cli login             # existing account
waap-cli whoami --json     # addresses for every chain
```

`whoami --json` is the address source. Read `evmWalletAddress`, `suiWalletAddress` and
`solanaWalletAddress` from it rather than storing an address anywhere.

## Check funds

```bash
waap-cli wallet-balance --chain evm:8453
```

## Send

```bash
waap-cli send-tx --chain evm:8453 --to 0xRECIPIENT --value 0.01 --json
```

For a native-token send, `--value` is in whole units: ETH on EVM, SUI on Sui, SOL on Solana. Do not
convert to wei, MIST or lamports. Token sends (`--mint`, `--coin-type`) use base units instead; see
the `pay-across-chains` skill.

A contract call is the same command with `--value 0` and the encoded call in `--data`:

```bash
waap-cli send-tx --chain evm:8453 --to CONTRACT_ADDRESS --value 0 --data 0x... --json
```

Chain identifiers: Base `evm:8453`, Ethereum `evm:1`, Solana `solana:mainnet`, Sui `sui:mainnet`.

Pass `--chain` on every call. `chain set` is deprecated and saves nothing.

`sign-tx` produces a signed artifact and does not broadcast it. To actually send, use `send-tx`.

## Where the key is

The agent holds a session, not a key, so no raw private key is ever present in the agent's
environment. Two modes back that, and they do not share a trust model:

- **Standard**, the default. The signature is produced in secure hardware on WaaP's
  infrastructure, gated by security policies.
- **WaaP Squid Mode**, an Ika MPC dWallet. The signature is completed by our enclave together with
  Ika's validator network, so no single party can complete it alone. In this mode only, the key is
  never reconstructed in one place.

Check which mode an account is in with `waap-cli squid status`.

## Next

- Limits and unattended runs: the `spend-limits` skill
- Paying someone in USDC: the `pay-across-chains` skill
- Every command and flag: the `waap-cli` skill
