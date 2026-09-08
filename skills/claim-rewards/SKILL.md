---
name: claim-rewards
description: Find rewards a wallet has already earned but never collected, and claim them once they go live on chain. Use when the user mentions unclaimed rewards, airdrop claim, Merkl, liquidity incentives, money they are owed, or wants an agent to watch for a claim opening and collect it instead of checking manually.
license: MIT
metadata:
  author: human.tech
  version: "1.0.0"
---

# Claim rewards

Money already earned and still sitting there. Two jobs: find it, then collect it when it opens.

Set up the wallet first with the `agent-wallet` skill.

## Find what is owed

Get the address to check:

```bash
waap-cli whoami --json
```

Read `evmWalletAddress` from it.

Then query Merkl for that address:

```bash
curl -s "https://api.merkl.xyz/v4/users/$ADDRESS/rewards?chainId=8453"
```

Each entry in `rewards[]` has `amount`, `claimed`, `pending`, `token.address`, `token.decimals`
and `proofs`. Unclaimed is `amount` minus `claimed`. Repeat per chain id. This is the same call the
existing claim-watch and gas-claims-reminder skills make.

Report nothing you did not read from a source.

## Decide whether it is worth claiming

Compare the reward value against the gas the claim will cost on that chain. A claim worth less
than its own gas is a loss, and small unclaimed balances often are. Say so and let it sit.

## Watch for the opening

Where a claim is announced but not live, poll for the specific condition rather than a date: the
claim contract deployed, a merkle root set, or an allocation endpoint returning a value for the
address. Check every ten minutes, report state changes only, and stay quiet otherwise.

## Claim

The Distributor on Base is `0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae`. Merkl has redeployed it
before, so confirm it at developers.merkl.xyz/resources/chains-and-contracts before building the
call.

```bash
waap-cli send-tx --chain evm:8453 --to 0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae --value 0 --data 0x71ee95c0... --json
```

The function is `claim(address[] users, address[] tokens, uint256[] amounts, bytes32[][] proofs)`,
selector `0x71ee95c0`. Four dynamic arrays, so encode with an ABI encoder (viem
`encodeFunctionData`, ethers `Interface.encodeFunctionData`) rather than by hand. Every value comes
from the rewards response: your address, `token.address`, `amount`, and `proofs`.

## Hand off when it is large

For anything the user would want to see before it moves, report the claim and let them run it or
approve it. Collecting a big allocation unattended is not a favour.

Report the transaction hash, the token and the amount after every claim.
