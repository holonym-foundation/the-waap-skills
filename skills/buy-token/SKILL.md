---
name: buy-token
description: Buy a fixed dollar amount of a token on a repeating schedule from an agent wallet, with a per-buy cap, a slippage guard, a dry run by default, and a running cost basis. Use when the user wants to dollar-cost average, mentions DCA, recurring buy, accumulate, or wants an agent to make the same small purchase daily or weekly without asking each time.
license: MIT
metadata:
  author: human.tech
  version: "1.0.0"
---

# Buy a token on a schedule

Spend a fixed amount of USDC on the same token at a set cadence, and keep the record.

Set up the wallet first with the `agent-wallet` skill.

## Before the first buy, agree four things with the user

- **Token and chain.** Get the contract address from the user or a source they name, never from a
  ticker match.
- **Amount per buy and cadence.** For example 50 USDC weekly.
- **Per-buy cap.** A hard ceiling the skill refuses to exceed even if asked.
- **Maximum slippage.** Refuse the buy rather than accept a worse price.

## Read before you sign

Dry run by default. Quote the swap, print what it would cost and what it would return, and stop
there. Only execute when the user has asked for a live run, or when this is a scheduled buy they
already approved.

Quote against the pool directly. `waap-cli request` is a closed allowlist of read-only calls, not
an arbitrary RPC passthrough, and the member you want is `eth_call`:

```bash
waap-cli request eth_call '{"to":"0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a","data":"0x..."}' --chain evm:8453
```

That returns the Uniswap v3 QuoterV2 output for the input amount. Compare it against the mid price
and abort if the gap is over the agreed slippage.

QuoterV2 is `quoteExactInputSingle((address tokenIn, address tokenOut, uint256 amountIn, uint24 fee, uint160 sqrtPriceLimitX96))`. Base USDC is `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`. Use fee `500` for a stable pair and `3000` otherwise. Selector `0xc6a5026a`.

## Execute

Two transactions, in order:

```bash
# 1. approve the router to spend USDC, if the allowance is short
waap-cli send-tx --chain evm:8453 --to 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 --value 0 --data 0x095ea7b3... --json

# 2. swap
waap-cli send-tx --chain evm:8453 --to 0x2626664c2603336E57B271c5C0b26F421741e481 --value 0 --data 0x... --json
```

The router is SwapRouter02, `exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96))`, selector `0x04e45aaf`. There is no deadline field; the older SwapRouter signature with a deadline reverts against this address. Seven fields, so encode with an ABI encoder rather than by hand. Set `amountOutMinimum` to the quoted `amountOut` times (1 minus slippage), rounded down, as an integer in the token's base units. For 1 percent slippage multiply by 0.99.

Addresses are from Uniswap's Base deployments page (docs.uniswap.org/contracts/v3/reference/deployments/base-deployments) and do not change.

Both are contract calls; the form is in the `agent-wallet` skill.

Check the allowance first with `waap-cli request eth_call` against USDC using `allowance(owner,spender)`, selector `0xdd62ed3e`, and skip step 1 when it already covers the buy. An unnecessary
approval costs gas and widens exposure.

## Limits

Swaps are contract calls, and the daily spend limit does not count them at any size; the engine
treats an unrecognised call as advisory and releases it. This skill's per-buy cap is the real
control on a scheduled buy, not the wallet policy. Set it deliberately and say so to the user. For an unattended schedule, mint a Privilege scoped
to the router and chain; a Privilege lives at most two hours, so a weekly schedule mints a fresh one
before each buy. See the `spend-limits` skill.

```bash
waap-cli privilege create --allow 0x2626664c2603336E57B271c5C0b26F421741e481 \
  --amount-usd 50 --expiry-seconds 900 --chain evm:8453 --json
```

## Keep the record

After each buy append: date, amount in, tokens out, effective price, transaction hash. Report the
running average cost when the user asks how the position is doing.
