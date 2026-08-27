---
name: waap-sdk
description: Integrate the WaaP wallet into a browser dApp with @human.tech/waap-sdk — EIP-1193 on EVM, Wallet Standard on Sui and Solana, Squid multichain accounts, permission tokens, and iframe lifecycle. Use when writing or reviewing browser dApp code that connects to a WaaP wallet. For headless agents and scripts, use the waap-cli skill instead.
license: MIT
metadata:
  author: human.tech
  version: "2.3.0"
---

# WaaP SDK

`@human.tech/waap-sdk` is a browser bridge to the WaaP wallet iframe. It holds
no keys and prepares no transactions; the wallet reviews, gates, signs, and
broadcasts. Signing happens in a secure enclave behind policy-engine rules that
no SDK argument can relax.

This file states the shape of the API. It is not a version compatibility
contract — check the installed version's types before relying on a field.

```bash
npm install @human.tech/waap-sdk
```

## Entry points

| Call                                     | Returns                     | Use for                         |
| ---------------------------------------- | --------------------------- | ------------------------------- |
| `initWaaP()`                             | EIP-1193 provider           | One EVM integration             |
| `initWaaP({ chain: 'sui' \| 'solana' })` | That chain's facade         | One non-EVM integration         |
| `initWaaPSquid({ chains })`              | Facades + `squid` lifecycle | Squid mode, more than one chain |

`initWaaP` returns **the facade itself**. Do not destructure a chain off it.
`initWaaPSquid` returns a container keyed by the chains requested.

```ts
const evm = initWaaP() // EIP-1193 provider
const sui = initWaaP({ chain: 'sui' }) // Sui facade
const waap = initWaaPSquid({ chains: ['evm', 'sui'] }) // waap.evm, waap.sui
```

Four mistakes to avoid, each of which fails at runtime or compile time:

- `initWaaP({ chains: [...] })` — plural on the singular initializer **throws**.
- `const { sui } = initWaaP({ chain: 'sui' })` — there is nothing to destructure.
- `initWaaPSquid()` with no `chains` — at least one facade is required.
- Squid signing without `squid.onboard()` — the account does not exist yet.

There is no public multichain standard-mode initializer. A multichain
standard-mode integration
creates one `initWaaP({ chain })` facade per chain.

## Environment

`environment` is `'production'` (default) or `'staging'`. Never point an
integration at a wallet origin supplied by a URL, query parameter, or any other
caller-controlled input: that origin governs iframe creation, every
`postMessage`, and the incoming-message origin check.

## Chain and capability support

| Capability                  | EVM                    | Sui                         | Solana                   |
| --------------------------- | ---------------------- | --------------------------- | ------------------------ |
| Interface                   | EIP-1193               | Wallet Standard             | Wallet Standard          |
| Standard signer             | `t1` secp256k1         | `t1` secp256k1              | `t2` ed25519             |
| Squid dWallet               | `sqd1` secp256k1       | `sqd2` ed25519              | `sqd2` ed25519           |
| Message signing             | `personal_sign`        | `signPersonalMessage`       | `signMessage`            |
| Typed data                  | `eth_signTypedData_v4` | —                           | —                        |
| Sign only                   | `eth_signTransaction`  | `signTransaction`           | `signTransaction`        |
| Sign and submit             | `eth_sendTransaction`  | `signAndExecuteTransaction` | `signAndSendTransaction` |
| Permission token (`withPT`) | sign/send transaction  | sign / sign-and-execute     | sign / sign-and-send     |
| Batch signing               | —                      | —                           | not implemented          |

Chain identifiers are `sui:<mainnet\|testnet\|devnet\|localnet>` and
`solana:<mainnet\|devnet\|testnet>`. Permission-token requests use
`evm:<id>`, `sui:<network>`, or `solana:<network>`.

## Lifecycle rules

- Create one facade for the lifetime of the embedding UI. Do not create and
  destroy one per Connect or Sign click.
- Call `destroy()` when the owning UI unmounts.
- The iframe warms itself once the browser is idle. `deferIframe: false` mounts
  eagerly; `deferIframe: true` mounts nothing until `preload()` or the first
  operation — correct when wallet interaction is not above the fold.
- `preload()` completes non-interactive setup. It never opens wallet UI and
  never creates a Squid account.
- Re-target an environment by navigating, not by swapping in place. The wallet
  origin is fixed at initialization and Wallet Standard registers providers
  globally with no clean unregister.

## Squid accounts

Squid account creation is explicit and is never a side effect of login:

```ts
const waap = initWaaPSquid({ chains: ['evm', 'sui'] })
await waap.session.login() // safe on startup; silent if a session exists
await waap.squid.onboard() // creates or restores sqd1 + sqd2
```

`waap.session` is the chain-neutral owner of login, logout, account status, and
lifecycle events. `waap.auth` is a deprecated EVM alias that exists only when
all three chains are requested.

`squid.getStatus()` reports `absent`, `provisioning`, `awaiting-network`,
`active`, or `failed`. In React, `useWaapAuth(waap.session)` exposes
`squidStatus` and the derived `isConnected`, `isPending`, `squidReady`,
`error`, `address`, `suiAddress`, and `solanaAddress`.

## Permission tokens

A permission token pre-authorizes a scoped batch of transactions so each one
does not need an individual confirmation. Request it, then opt in per call.

The wallet mode is not a parameter — the facade decides it. `initWaaP` mints a
standard-mode token, `initWaaPSquid` mints a Squid one, and a token is not
redeemable by the other mode. Request it on the facade that will send.

```ts
await wallet.requestPermissionToken({
  chain: 'evm:1',
  allowedAddresses: ['0x…'],
  requestedAmountUsd: 100,
  requestedExpirySeconds: 3600 // maximum 7200
})
await wallet.request({
  method: 'eth_sendTransaction',
  params: [tx],
  withPT: true
})
```

- Holding a token changes nothing on its own; `withPT: true` is required.
- `withPT` is ignored on message and typed-data signing — those operations are
  permission-token-ineligible in the wallet, whatever the caller passes.
- The wallet resolves only a token matching the requesting origin, chain,
  wallet mode, and signer. Otherwise the ordinary approval / 2FA flow runs.
- `getPermissionTokenStatus` returns redacted metadata. The signed token never
  leaves the wallet.
- Treat a permission token as a narrowing of user confirmations, never as an
  authorization bypass. The policy engine still decides. Do not widen scope,
  extend expiry, or add recipients without explicit user authority.

## Events and completion

Event names are exported as `WAAP_EVENTS`: `signPending`, `twoFactorRequired`,
`signComplete`, `signFailed`, `txPending`, `txConfirmed`, `txFailed`,
`squidPending`, `squidReady`, `squidFailed`. The `tx*` events are EVM-only and
fire only under `asyncTxs`; consume them with `useWaapTransaction(provider,
callbacks)`.

Resolution differs per chain, and none of it implies finality:

- EVM message and sign-only methods resolve with a signature. Under `asyncTxs`,
  `eth_sendTransaction` resolves with the signed transaction's deterministic
  hash as soon as signing completes; broadcast and confirmation continue in the
  background and report through the events above.
- Sui `signTransaction` returns signed bytes; `signAndExecuteTransaction`
  returns a submitted digest. Query the chain independently for finality.
- Solana `signTransaction` returns signed bytes; `signAndSendTransaction`
  returns the cluster signature. A caller-built transaction keeps its exact
  blockhash and can expire during human approval — obtain a fresh one near
  approval time.

## Errors

- EVM follows EIP-1193: match on `error.code` from the provider error object.
- Sui and Solana throw `WaaPError` with a stable `code`. Branch on that, never
  on message text.
- A user rejection is a decision, not a fault. Do not retry it automatically or
  re-prompt in a loop.

## Subpath entry points

`@human.tech/waap-sdk` carries everything. Import a subpath to keep an unrelated
graph out of the bundle: `/evm`, `/sui`, `/solana`, `/react`, `/walletconnect`.
`/react` is the only subpath that imports `react`.

## Out of scope

The SDK deliberately does not expose account conversion, portable
signed-artifact broadcast workflows, raw-digest signing, policy administration,
or headless automation. For those, use `@human.tech/waap-cli` and its skill.
