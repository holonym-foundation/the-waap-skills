---
name: pay-across-chains
description: Pay someone in USDC on the chain they are on, EVM, Solana or Sui, from one agent wallet that transacts natively on each chain. Use when the user wants an agent to pay a person, contractor, vendor or another agent, mentions payout, invoice, settle up, send USDC, or needs one wallet to pay on more than one network.
license: MIT
metadata:
  author: human.tech
  version: "1.0.0"
---

# Pay across chains

One account pays on EVM, Solana and Sui. Each payment is a native transaction on its own chain.
Nothing moves between chains.

Set up the wallet first with the `agent-wallet` skill.

## Ask two questions before paying

1. Which chain is the recipient on? Never assume EVM.
2. Does the wallet hold USDC on that chain? Check with `waap-cli wallet-balance --chain <chain>`.

## Solana

```bash
waap-cli send-tx --chain solana:mainnet \
  --to RECIPIENT_ADDRESS \
  --mint EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v \
  --value 250000000 \
  --json
```

With `--mint` set, `--value` is in base units. USDC has 6 decimals, so 250 USDC is `250000000`.

## Sui

Sui token payments run through the Squid signer. `--coin-type` exists only on `squid send-tx`, not
on the standard `send-tx`, so the account has to be in WaaP Squid Mode for this path. Check first
with `waap-cli squid status`.

```bash
waap-cli squid send-tx --chain sui:mainnet \
  --to RECIPIENT_ADDRESS \
  --coin-type 0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC \
  --value 250000000 \
  --json
```

Same rule as Solana: with `--coin-type` set, `--value` is in base units, not whole USDC. USDC is 6 decimals on every chain Circle issues it on, so 250 USDC is 250000000 on Sui as well.

Native SUI is different and needs no Squid account: plain `send-tx --chain sui:mainnet --value 0.1`
works, and there `--value` is in whole SUI.

If `squid status` reports standard mode, run `waap-cli squid init` to provision Squid Mode, or pay native SUI instead.

## EVM

There is no token flag on EVM. USDC is an ERC-20, so the payment is a contract call: send to the
**token contract**, with `--value 0`, and put the transfer in `--data`.

Build the calldata as the 4-byte selector for `transfer(address,uint256)`, then the recipient
address and the amount, each padded to 32 bytes:

```bash
# 0xa9059cbb                                                        transfer(address,uint256)
# 000000000000000000000000<recipient without 0x>                    address, left padded
# 000000000000000000000000000000000000000000000000000000000ee6b280   250 USDC = 250000000 = 0xee6b280, left padded

waap-cli send-tx --chain evm:8453 \
  --to 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 \
  --value 0 \
  --data 0xa9059cbb0000000000000000000000001111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000ee6b280 \
  --json
```

Any ABI encoder produces this string; the contract-call form is in the `agent-wallet` skill.

Sending USDC to the recipient address instead of the contract address does nothing and burns gas.
Check the `--to` is the token contract before signing.

## Where these addresses come from

All three USDC identifiers are Circle's native issuance, from Circle's contract-address page
(developers.circle.com/stablecoins/usdc-contract-addresses). They do not change. On Sui a separate
bridged USDC exists with a different coin type; use only the native one above.

## Gas

Gas is the chain's native token, not USDC, and the wallet needs it on whichever chain it is paying
on. The developer-funded gas tank sponsors **EVM** gas only; it does not pay the SUI and IKA fees a
Squid signature needs.

## Confirm

`--json` returns the transaction hash. Report the hash, the chain and the amount back to the user.
