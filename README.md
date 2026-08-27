# WaaP Skills Repository

Agent skills for [WaaP](https://waap.xyz) — operate a wallet from the command line, or integrate one into a browser dApp. This repository is structured for `skills.sh` and compatible skill loaders that discover skills from `skills/<skill-name>/SKILL.md`.

Each skill is rendered from the `.agent/SKILL.md` that ships inside its own npm package, so a skill never describes a build that is not published.

| Skill | Package | Use it for |
| --- | --- | --- |
| `waap-cli` | [`@human.tech/waap-cli`](https://www.npmjs.com/package/@human.tech/waap-cli) | Headless agents and scripts — account lifecycle, EVM/Sui/Solana signing and transactions, standard or Ika MPC dWallet (Squid) signing, policy and 2FA, scoped Privileges |
| `waap-sdk` | [`@human.tech/waap-sdk`](https://www.npmjs.com/package/@human.tech/waap-sdk) | Browser dApp code — EIP-1193 on EVM, Wallet Standard on Sui and Solana, Squid multichain accounts, permission tokens, iframe lifecycle |

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

## Documentation

[docs.waap.human.tech](https://docs.waap.human.tech) — see [For Agents → Claude Code](https://docs.waap.human.tech/for-agents/frameworks/claude-code) for the install path and worked examples.
