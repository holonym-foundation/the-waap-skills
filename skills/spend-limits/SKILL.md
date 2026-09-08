---
name: spend-limits
description: "Set what an agent may spend before you let it run unattended: a daily USD spend limit, 2FA on transactions above a risk threshold, and scoped pre-approvals that expire (two hours maximum, enforced server side) so one specific job runs without a prompt. Use when the user wants to limit what an agent can spend, mentions spending limit, daily limit, budget, guardrails, approval, 2FA, Privileges, or unattended and autonomous runs."
license: MIT
metadata:
  author: human.tech
  version: "1.0.0"
---

# Spend limits

Two controls, set in this order.

## The daily limit: where a human gets asked

```bash
waap-cli policy set --daily-spend-limit 500
waap-cli policy get
```

Read it as a threshold on the **day's running total**, not on one transaction. Under it the agent
acts alone. When the day's total reaches it, a human is asked once, out of band. It does not halt
the account, and the agent cannot raise it: a policy change always needs the human's current
second factor.

Turn on a factor before relying on any of this, or there is no one to ask:

```bash
waap-cli 2fa enable --email          # or --phone, --telegram, --wallet
waap-cli 2fa status
```

The limit counts priced sends, aggregated over the UTC day across every chain and both modes.
Swaps and other contract calls are advisory to the engine and release without counting, so a
trading or DCA skill runs outside the daily limit. Only a priced send crossing the day's total, or a
malicious counterparty, steps up. Verified by execution (Arun, mainnet) and by the engine's own tests
(silk `policyengine/src/utils/v3/decision.rs`, `evm erc20, token not priced` releases).

## A Privilege: the human's yes, given in advance

For one scoped job, mint a pre-approval so the agent is not prompted mid-run:

```bash
waap-cli privilege create \
  --allow 0xADDRESS_ONE 0xADDRESS_TWO \
  --amount-usd 200 \
  --expiry-seconds 2400 \
  --chain evm:8453 \
  --json
# Squid accounts: waap-cli squid privilege create, same flags
```

`--allow` takes one or more scopes: an address, `target:*`, or an EVM `target:selector`. `--amount-usd` is the lifetime ceiling. `--expiry-seconds` is at most 7200. Add `--require-2fa-for-high-risk-tx` to keep the ordinary 2FA prompt for high-risk transactions inside the Privilege. The ceiling is in USD. Each send's `--value` stays in the chain's native units; size it from a current price, and the engine prices it against the ceiling. Chain identifiers are listed in the `agent-wallet` skill; Base is `evm:8453`.

A Privilege carries an allowlist, a chain, a cumulative USD ceiling and an expiry. **Default 900
seconds, two hours maximum, enforced server side.** There is no per-grant revocation. Expiry is the
control, so mint the shortest one the job needs.

Pass it back on the run that uses it:

```bash
TOKEN=$(waap-cli privilege create --allow 0xADDRESS_ONE 0xADDRESS_TWO \
  --amount-usd 200 --expiry-seconds 2400 --chain evm:8453 --json | jq -r .permissionToken)

printf '%s' "$TOKEN" | waap-cli send-tx --privilege-stdin --chain evm:8453 --to 0xADDRESS_ONE --value 0.01 --json
printf '%s' "$TOKEN" | waap-cli send-tx --privilege-stdin --chain evm:8453 --to 0xADDRESS_TWO --value 0.01 --json
```

`--permission-token` is the deprecated spelling of the same thing. Use `--privilege-stdin`.

The ceiling is debited on every allowed send, including sends
that were already under the daily limit and would not have prompted anyone. Routine spending can
therefore drain a Privilege before the job it was minted for. Mint it as close to the job as
possible.

## What happens at the ceiling

The ceiling is hard for the Privilege's own budget: it cannot answer for a send past its
`--amount-usd`. It is not a stop on the agent. Reaching it ends the pre-approval and nothing more. The next request runs under the daily limit alone: below the day's
limit the agent still acts alone; at it a human is asked. A Privilege ceiling is a budget for the
job. Nothing stops spend absolutely except a human declining. Say that plainly to a
user who asks whether an agent can be stopped from spending.

## Order of setup

1. `2fa enable` so there is a factor to ask
2. `policy set --daily-spend-limit` for the standing baseline
3. `privilege create` per unattended job, shortest expiry that fits
