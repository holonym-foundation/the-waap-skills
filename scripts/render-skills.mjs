#!/usr/bin/env node
/**
 * Render the published form of the WaaP agent skills, from npm.
 *
 * Each package ships its own `.agent/SKILL.md` inside its tarball, reviewed
 * alongside the code it describes. This pulls the tarball that `latest`
 * resolves to and renders it into `skills/<slug>/`, adding the registry fields
 * the source does not carry (`license`, `metadata.version`) and a sidecar
 * manifest that pins the version.
 *
 * Sourcing from the tarball rather than from the source repository is what
 * keeps a skill from describing a build nobody can install: the version it
 * claims is by construction the version on npm.
 *
 * Usage: node scripts/render-skills.mjs [target-dir]   (default: repo root)
 *
 * Writes nothing when the rendered output already matches, so a caller can
 * commit unconditionally and get an empty diff on a no-op.
 */

import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

/** Every package that ships an agent skill. Add a row to publish a new one. */
const PACKAGES = [
  { name: '@human.tech/waap-cli', slug: 'waap-cli' },
  { name: '@human.tech/waap-sdk', slug: 'waap-sdk' }
]

const REFERENCES = ['https://waap.xyz', 'https://docs.waap.human.tech']

const target = process.argv[2] ?? join(dirname(fileURLToPath(import.meta.url)), '..')
const work = mkdtempSync(join(tmpdir(), 'waap-skills-'))

/** Fetch the tarball `latest` points at and return its unpacked root. */
function fetchPackage(name) {
  const out = execFileSync(
    'npm',
    ['pack', `${name}@latest`, '--pack-destination', work, '--json'],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] }
  )
  const filename = JSON.parse(out)[0]?.filename
  if (!filename) throw new Error(`npm pack returned no filename for ${name}`)

  const root = join(work, name.replace(/[^a-z0-9]+/gi, '-'))
  mkdirSync(root, { recursive: true })
  execFileSync('tar', ['-xzf', join(work, filename), '-C', root], { stdio: 'inherit' })
  return join(root, 'package')
}

const writes = []

try {
  for (const { name, slug } of PACKAGES) {
    const pkgRoot = fetchPackage(name)
    const skillPath = join(pkgRoot, '.agent/SKILL.md')
    if (!existsSync(skillPath)) {
      // A published package without its skill is a packaging regression in the
      // source repo, not something to paper over with a stale local copy.
      throw new Error(`${name} ships no .agent/SKILL.md`)
    }

    const version = JSON.parse(readFileSync(join(pkgRoot, 'package.json'), 'utf8')).version
    const source = readFileSync(skillPath, 'utf8')

    // Split the frontmatter without re-serializing it. The description is prose
    // that YAML would need quoting rules applied to; preserving the source lines
    // verbatim keeps this render from being a place where the wire form can drift.
    const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(source)
    if (!match) throw new Error(`${name} .agent/SKILL.md has no YAML frontmatter block`)
    const [, frontmatter, body] = match

    const carried = frontmatter
      .split('\n')
      .filter((line) => !/^(license|metadata):/.test(line) && !/^\s+\w+:/.test(line))
      .join('\n')

    const description = /^description:\s*(.+)$/m.exec(frontmatter)?.[1]?.trim()
    if (!description) throw new Error(`${name} frontmatter has no description`)

    const renderedSkill = `---
${carried}
license: MIT
metadata:
  author: human.tech
  version: ${JSON.stringify(version)}
---

${body.trimStart()}`

    const renderedMetadata =
      JSON.stringify(
        {
          version,
          organization: 'Human.tech',
          date: new Date().toLocaleString('en-US', {
            month: 'long',
            year: 'numeric',
            timeZone: 'UTC'
          }),
          abstract: description,
          references: REFERENCES
        },
        null,
        2
      ) + '\n'

    const dir = join(target, 'skills', slug)
    mkdirSync(dir, { recursive: true })
    writes.push([join(dir, 'SKILL.md'), renderedSkill], [join(dir, 'metadata.json'), renderedMetadata])
    console.log(`rendered ${slug} at ${version}`)
  }
} finally {
  rmSync(work, { recursive: true, force: true })
}

let changed = 0
for (const [path, content] of writes) {
  const current = existsSync(path) ? readFileSync(path, 'utf8') : null
  if (current === content) continue
  writeFileSync(path, content)
  console.log(`  updated ${relative(target, path)}`)
  changed += 1
}

console.log(
  changed === 0
    ? `already in sync (${PACKAGES.length} skills)`
    : `synced ${changed} file(s) across ${PACKAGES.length} skills`
)
