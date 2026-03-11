# WaaP Skills Repository

This repository is structured for `skills.sh` and compatible skill loaders that discover skills from `skills/<skill-name>/SKILL.md`.

## Repository Layout

```text
.
├── .claude-plugin/
│   └── plugin.json
└── skills/
    └── waap-cli/
        ├── SKILL.md
        └── metadata.json
```

## Install

After publishing this repository to GitHub:

```bash
npx skills add https://github.com/<your-org>/<your-repo> --skill waap-cli
```

Or install all skills in the repo:

```bash
npx skills add https://github.com/<your-org>/<your-repo>
```
