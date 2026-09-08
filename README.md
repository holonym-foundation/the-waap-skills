# WaaP Skills Repository

Agent skills for [WaaP](https://waap.xyz) — operate a wallet from the command line, or integrate one into a browser dApp. This repository is structured for `skills.sh` and compatible skill loaders that discover skills from `skills/<skill-name>/SKILL.md`.

Two kinds of skill live here.

**Rendered references** (`waap-cli`, `waap-sdk`) are generated from the `.agent/SKILL.md` that ships inside each npm package, so a reference never describes a build that is not published. Do not edit them here; the weekly sync overwrites them.

**Authored recipes** (`agent-wallet`, `pay-across-chains`, `spend-limits`, `buy-token`, `claim-rewards`) are one job each, written by hand, verified against the shipped CLI, and versioned on their own. The sync never touches them.

| Skill | Package | Use it for |
| --- | --- | --- |
| `waap-cli` | [`@human.tech/waap-cli`](https://www.npmjs.com/package/@human.tech/waap-cli) | Headless agents and scripts — account lifecycle, EVM/Sui/Solana signing and transactions, standard or Ika MPC dWallet (Squid) signing, policy and 2FA, scoped Privileges |
| `waap-sdk` | [`@human.tech/waap-sdk`](https://www.npmjs.com/package/@human.tech/waap-sdk) | Browser dApp code — EIP-1193 on EVM, Wallet Standard on Sui and Solana, Squid multichain accounts, permission tokens, iframe lifecycle |
| `agent-wallet` | recipe | Give an agent a wallet: sign in, balances, send on EVM, Solana and Sui |
| `pay-across-chains` | recipe | Pay USDC on whichever chain the recipient is on |
| `spend-limits` | recipe | Daily limit, 2FA, and expiring pre-approvals for unattended runs |
| `buy-token` | recipe | Buy a fixed amount on a schedule with a per-buy cap |
| `claim-rewards` | recipe | Find and claim rewards already earned |

## Install

All skills in the repository:

```bash
npx skills add holonym-foundation/the-waap-skills
```

A single skill:

```bash
npx skills add holonym-foundation/the-waap-skills --skill waap-cli
```

## Repository Layout

```text
.
├── .claude-plugin/
│   └── plugin.json
└── skills/
    ├── waap-cli/
    │   ├── SKILL.md
    │   └── metadata.json
    └── waap-sdk/
        ├── SKILL.md
        └── metadata.json
```

## Keeping this in sync

`scripts/render-skills.mjs` renders each skill from the `.agent/SKILL.md` inside its published npm tarball. `.github/workflows/sync-skills.yaml` runs it weekly and opens a pull request when the published packages have moved.

Edit a skill in its own package and release it; the render follows. Changes made directly here are overwritten on the next run.

## Documentation

[docs.waap.human.tech](https://docs.waap.human.tech) — see [For Agents → Claude Code](https://docs.waap.human.tech/for-agents/frameworks/claude-code) for the install path and worked examples.
