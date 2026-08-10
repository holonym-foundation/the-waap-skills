---
name: waap-cli
description: Operate a WaaP wallet through @human.tech/waap-cli for email-approved account lifecycle, EVM/Sui/Solana signing and transactions, standard or Ika MPC dWallet (Squid) signing, policy/2FA management, scoped Privileges, balances, and machine-readable automation. Use when a user asks an agent to operate a WaaP wallet through waap-cli.
license: MIT
metadata:
  author: human.tech
  version: "2.0.0"
---

# WaaP CLI

Operate the installed `@human.tech/waap-cli` without handling raw private keys.
Treat its versioned runtime schema as authoritative; do not scrape help or rely
on this file for flag-level compatibility.

```bash
waap-cli --version
waap-cli commands --json    # alias: waap-cli schema --json
waap-cli <command> --help
```

`commands --json` is one NDJSON `result` event containing the installed CLI
version, schema version, every command path, options, aliases, hidden state,
and its `public`, `local`, `optional`, or `signing` authentication boundary.

## Safety and automation rules

- Append `--json` for automation. Read NDJSON from stdout; progress is on stderr.
- Branch on stable error codes, never free-form messages. Retain
  `INSUFFICIENT_BALANCE` as a compatibility code even though modern on-chain
  insufficiency normally reports `INSUFFICIENT_FUNDS`.
- Use `--password-stdin`; never put passwords in shell history, process
  arguments, environment variables, or logs.
- Treat a Privilege (`--privilege-stdin`) as a bearer
  secret. Do not print, persist, or reuse it outside its precise scope.
- Use an isolated `WAAP_CLI_SESSION_DIR` for each agent or CI job. The CLI does
  not load a working-directory `.env` file.
- Confirm chain, destination, asset, amount, and wallet mode before any
  irreversible transaction. Do not change policy, 2FA, migrate a legacy wallet,
  or initialize Squid without explicit user authority.

| Exit | Code                    | Agent response                                 |
| ---: | ----------------------- | ---------------------------------------------- |
|    0 | —                       | Consume the result.                            |
|    1 | `UNKNOWN`               | Report the failure; do not invent recovery.    |
|    2 | `NO_SESSION`            | Authenticate again.                            |
|    3 | `INVALID_PARAMS`        | Correct the command input.                     |
|    4 | `POLICY_REJECTED`       | Report the policy/approval decision.           |
|    5 | `INSUFFICIENT_BALANCE`  | Compatibility failure from an older backend.   |
|    6 | `INSUFFICIENT_FUNDS`    | Fund the selected on-chain wallet.             |
|    7 | `NETWORK`               | Retry only a safe, idempotent operation.       |
|    8 | `TWO_FA_TIMEOUT`        | Start a new approval only with user direction. |
|    9 | `RPC_PROTOCOL_MISMATCH` | Correct the EVM RPC method or selected chain.  |

## Chain and signer support

| Capability                   |       EVM        |      Sui       |     Solana     |
| ---------------------------- | :--------------: | :------------: | :------------: |
| Standard account             |  `t1` secp256k1  | `t1` secp256k1 |  `t2` ed25519  |
| Standard `sign-message`      |       Yes        |      Yes       |      Yes       |
| Standard `sign-typed-data`   |   Yes, EIP-712   |       —        |       —        |
| Standard `sign-tx`/`send-tx` |       Yes        |      Yes       |      Yes       |
| Squid Ika MPC dWallet        | `sqd1` secp256k1 | `sqd2` ed25519 | `sqd2` ed25519 |
| Squid `sign-message`         |       Yes        |      Yes       |      Yes       |
| Squid `sign-typed-data`      |   Yes, EIP-712   |       —        |       —        |
| Squid `sign-tx` / `send-tx`  |       Yes        |      Yes       |      Yes       |
| `request` (EIP-1193)         |       Yes        |       —        |       —        |

Use canonical chains: EVM `8453`, `evm:8453`, or `eip155:8453`; Sui
`sui:<mainnet|testnet|devnet|localnet>`; Solana
`solana:<mainnet|devnet|testnet>`. `solana:mainnet-beta` aliases mainnet. Do
not use friendly EVM names such as `base`.

## Wallet modes

### Standard — default account

Fresh accounts use standard mode (TAP is its protocol name, which surfaces in
the `t1`/`t2` key labels). `t1` is the secp256k1 signer for EVM and Sui;
`t2` is the ed25519 signer for Solana. New accounts never create a 2PC keyshare.

Legacy 2PC accounts convert during `login`, not through a separate command.
The CLI asks the key manager what state the account is in; if a legacy key is
still waiting it decrypts the client share in memory only, and the enclave
reconstructs and address-verifies the old secp256k1 key before importing it as
standard `t1`. EVM/Sui addresses are unchanged; `t2` adds a Solana address. Running
`login` again is safe and is the remedy if signing reports a stale account
state.

### Squid — Ika MPC dWallet mode

Squid is an optional shared Ika Lite MPC dWallet path, not a fallback standard key:

- `sqd1` is the secp256k1 dWallet for EVM.
- `sqd2` is the ed25519 dWallet for Sui and Solana.
- Run `waap-cli squid init` explicitly before Squid signing; send/sign never
  creates dWallets implicitly.
- `squid status`, `squid addresses`, and `squid refill` inspect or pre-warm the
  durable dWallet/presign state.
- Deployment availability is manifest-gated. Development/staging use reviewed
  test deployments; production fails closed until its reviewed deployment is
  available.

## Current command inventory

| Area                 | Commands                                                                                                                                         | Notes                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| Discovery            | `--version`, `commands` / `schema`, `completion <bash                                                                                            | zsh                                                                         | fish>` | `commands --json` is the agent contract. |
| Registration         | `signup`, `signup --resume`, `login`, `reset-password`, `logout`, `session-info`, `whoami`                                                       | Signup waits for explicit email approval; reset completes in the wallet UI. |
| Standard signing     | `sign-message`, `sign-typed-data`, `sign-tx`, `send-tx`                                                                                          | Every operation requires `--chain`; EIP-712 domain chain ID must match it.  |
| Squid signing        | `squid status`, `squid addresses`, `squid init`, `squid refill`, `squid sign-message`, `squid sign-typed-data`, `squid sign-tx`, `squid send-tx` | EIP-712 is Squid `sqd1` / EVM only.                                         |
| Chain and reads      | `chain get`, deprecated `chain set`, `request <method> [params...]`, `wallet-balance`                                                            | `request` is read-only/account EIP-1193; use direct sign/send commands.     |
| Policy and approvals | `policy get`, `policy set --daily-spend-limit <usd>`, `2fa status`, `2fa enable`, `2fa disable`                                                  | Policy/2FA mutations are signing operations.                                |
| Automation scope     | `privilege create`, `squid privilege create`                                                                                                     | The path sets the wallet mode. Alias group: `permission-token create`.      |

The hidden deprecated `balance` command remains an alias for `wallet-balance`.

## Common workflows

Create an email-approved account without exposing a password:

```bash
printf '%s\n' "$WAAP_PASSWORD" |
  waap-cli signup --email agent@example.com --name "Agent Wallet" \
    --password-stdin --json
```

If interrupted, resume from the same `WAAP_CLI_SESSION_DIR`:

```bash
waap-cli signup --resume --json
```

Use a standard-mode transaction:

```bash
waap-cli send-tx --chain evm:8453 --to 0xRecipient --value 0.01 --json
```

Use a Squid EIP-712 signature:

```bash
waap-cli squid sign-typed-data \
  --chain evm:8453 \
  --data '{"types":{"Mail":[{"name":"contents","type":"string"}]},"domain":{"name":"WaaP example","version":"1","chainId":8453},"primaryType":"Mail","message":{"contents":"approval"}}' \
  --json
```

Create a narrow automation Privilege, then supply the returned encoded value
only to its matching transaction:

```bash
# standard mode
waap-cli privilege create \
  --chain evm:84532 --allow 0xRecipient \
  --amount-usd 1 --expiry-seconds 900 --json

# Squid
waap-cli squid privilege create \
  --chain evm:84532 --allow 0xRecipient \
  --amount-usd 1 --expiry-seconds 900 --json
```

The wallet mode is the command path, not an option — there is no
`--wallet-mode`. A Privilege minted on one path is not redeemable by the
other, so mint it on the same path the transaction will use.

`privilege create` binds the CLI origin, chain, wallet mode, recipients, USD
allowance, and expiry. By default it can allow ordinary threshold findings to
proceed without another 2FA prompt when PE accepts the scope. Add
`--require-2fa-for-high-risk-tx` to retain that challenge.
Pipe the encoded result into a matching transaction with `--privilege-stdin`;
never place it directly in argv or the process environment.

## Transaction inputs and lifecycle

- Use `send-tx` / `squid send-tx` to prepare, policy-gate, sign, broadcast, and
  optionally `--wait` for terminal status.
- Use `sign-tx` / `squid sign-tx` only for a signed artifact to inspect or hand
  to an external broadcaster. The CLI does not broadcast saved artifacts.
- For direct transfers, `--value` is whole ETH/SUI/SOL. Solana SPL transfers use
  `--mint` and raw token base units.
- For structured inputs use literal `--tx` or stdin with `--tx -`; `@file` is
  intentionally unsupported. Select the chain-specific `--tx-format`:
  EVM `json|hex`, Sui `json|base64`, Solana `json|legacy-message|v0-message`.
- Do not add `--rpc` to transaction commands. Preparation and broadcast use the
  authenticated WaaP service.

## Breaking changes and migration notes

| Status         | Change                                                                                  | Agent adaptation                                                                                                                                                     |
| -------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Removed        | `broadcast-tx`                                                                          | Do not save an artifact expecting this CLI to submit it later. Use `send-tx` / `squid send-tx` for CLI broadcast, or an external broadcaster for a handoff artifact. |
| Removed        | `cancel --msg-hash --authz-kind`                                                        | Do not issue low-level PE cancellation from the CLI. Transaction runners and browser/SDK flows own exact-operation cancellation.                                     |
| Removed        | Fee, top-up, referral, announcement, `agent-balance`, and related legacy command groups | Do not generate them; inspect `commands --json` before adapting old automation.                                                                                      |
| Deprecated     | `--chain-id`                                                                            | Use `--chain`.                                                                                                                                                       |
| Deprecated     | `--tx-bytes`, `--tx-json`                                                               | Use `--tx` with `--tx-format`.                                                                                                                                       |
| Deprecated     | `--privilege <encoded>`, `--permission-token <encoded>`                                 | Use `--privilege-stdin`; the `permission-token` command-group alias remains for compatibility.                                                                       |
| Deprecated     | `balance`                                                                               | Use `wallet-balance`.                                                                                                                                                |
| Removed config | Per-service origins, password, Squid behavior, and Privilege env vars                   | Only `WAAP_NODE_ENV` (or the older `SILK_NODE_ENV`) and `WAAP_CLI_SESSION_DIR` are read.                                                                             |
| Unsupported    | `--prepare`, raw `@file` transaction inputs                                             | Use the current `--tx` / stdin contract.                                                                                                                             |

Run `commands --json` after upgrading and regenerate stored command templates
from its schema. Never auto-upgrade, weaken policy, or broaden a Privilege.
