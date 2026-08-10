# WaaP Skills Repository

This repository is structured for `skills.sh` and compatible skill loaders that discover skills from `skills/<skill-name>/SKILL.md`.

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

## Skills

| Skill | For | Also ships in |
| --- | --- | --- |
| `waap-cli` | Headless agents and scripts driving a wallet via `@human.tech/waap-cli` | `node_modules/@human.tech/waap-cli/.agent/SKILL.md` |
| `waap-sdk` | Browser dApp code integrating `@human.tech/waap-sdk` | `node_modules/@human.tech/waap-sdk/.agent/SKILL.md` |

## Install

```bash
# One skill
npx skills add holonym-foundation/the-waap-skills --skill waap-cli

# Every skill in the repo
npx skills add holonym-foundation/the-waap-skills
```

Each skill is also published inside its own npm package, so installing the
package gives you a copy versioned with the code it describes.

## Do not hand-edit the skills

`skills/*/SKILL.md` and `skills/*/metadata.json` are generated upstream and
pushed here automatically on each release. Edits made in this repository are
overwritten by the next sync.

`README.md` and `.claude-plugin/plugin.json` are hand-maintained: the pack
version is not derivable from two packages that release on independent
cadences.
