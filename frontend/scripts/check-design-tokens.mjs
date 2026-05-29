#!/usr/bin/env node
/**
 * Design-token lint gate.
 *
 * Fails the build if source files drift away from the design system:
 *   1. Raw Tailwind palette colors (e.g. `text-slate-400`, `bg-emerald-500/15`,
 *      `border-l-rose-400/70`) instead of semantic tokens
 *      (`text-text-muted`, `bg-success/15`, `text-danger`, …).
 *   2. Hardcoded `text-4xl` page titles instead of the type scale
 *      (`text-h1` / `text-display`).
 *
 * White-on-fill (`text-white`, `bg-white`) is allowed — it has no numeric shade
 * and is the correct foreground on accent/info/danger fills.
 *
 * Run: `node scripts/check-design-tokens.mjs` (wired into `prebuild`).
 */
import { readdir, readFile } from 'node:fs/promises'
import { join, relative } from 'node:path'

const ROOT = process.cwd()
const SRC = join(ROOT, 'src')

// Tailwind default palette families that must not be used directly.
const PALETTE = [
  'slate', 'gray', 'zinc', 'neutral', 'stone',
  'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal',
  'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose',
].join('|')

// Utility prefixes that take a color (longest border-side variants first).
const PREFIX = [
  'text', 'bg',
  'border-x', 'border-y', 'border-s', 'border-e',
  'border-t', 'border-r', 'border-b', 'border-l', 'border',
  'ring-offset', 'ring', 'from', 'via', 'to', 'divide',
  'fill', 'stroke', 'placeholder', 'decoration', 'outline', 'caret', 'accent', 'shadow',
].join('|')

const SHADE = '50|100|200|300|400|500|600|700|800|900|950'

const RULES = [
  {
    id: 'raw-palette-color',
    re: new RegExp(`\\b(?:${PREFIX})-(?:${PALETTE})-(?:${SHADE})\\b`, 'g'),
    hint: 'use a semantic token: text-text-{primary,secondary,muted}, bg-surface-{1,2,3}, border-border, or success/warning/danger/info/accent',
  },
  {
    id: 'hardcoded-title-size',
    re: /\btext-4xl\b/g,
    hint: 'use the type scale: text-h1 (28px) or text-display (40px)',
  },
]

async function walk(dir) {
  const out = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      out.push(...(await walk(full)))
    } else if (/\.(tsx|ts)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
      out.push(full)
    }
  }
  return out
}

const files = await walk(SRC)
const violations = []

for (const file of files) {
  const lines = (await readFile(file, 'utf8')).split('\n')
  lines.forEach((line, i) => {
    for (const rule of RULES) {
      rule.re.lastIndex = 0
      let m
      while ((m = rule.re.exec(line)) !== null) {
        violations.push({
          file: relative(ROOT, file),
          line: i + 1,
          match: m[0],
          rule: rule.id,
          hint: rule.hint,
        })
      }
    }
  })
}

if (violations.length === 0) {
  console.log('✓ design tokens: no raw palette colors or off-scale titles')
  process.exit(0)
}

console.error(`\n✖ design-token check failed — ${violations.length} violation(s):\n`)
const byRule = new Map()
for (const v of violations) {
  if (!byRule.has(v.rule)) byRule.set(v.rule, [])
  byRule.get(v.rule).push(v)
}
for (const [rule, items] of byRule) {
  console.error(`  [${rule}] — ${items[0].hint}`)
  for (const v of items) {
    console.error(`    ${v.file}:${v.line}  ${v.match}`)
  }
  console.error('')
}
process.exit(1)
