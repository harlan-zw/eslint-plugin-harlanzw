import type { Linter } from 'eslint'
import type { ThemeTokenOptions } from './rules/vue-prefer-theme-tokens'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { __unstable__loadDesignSystem, compile } from '@tailwindcss/node'
import { baseUtility } from './design-classes'
import { plugin } from './index'
import { cssClasses } from './tailwind-context'

export interface TailwindOptions extends ThemeTokenOptions {
  stylesheet: string
  files?: string[]
  ignores?: string[]
  /** Additional CSS entries loaded by this site. */
  stylesheets?: string[]
  /** Also report unknown custom class names. */
  strict?: boolean
}

/** Load once in ESLint configuration. Stylesheet failures stop linting with their original error. */
export async function tailwind({ stylesheet, stylesheets = [], files = ['**/*.vue'], ignores = ['**/OgImage/**', '**/*.takumi.vue'], strict = false, ...policy }: TailwindOptions): Promise<Linter.Config> {
  const path = resolve(stylesheet)
  const css = [await readFile(path, 'utf8'), ...stylesheets.map(file => `@import ${JSON.stringify(resolve(file))};`)].join('\n')
  const dependencies = new Set([path])
  const compiler = await compile(css, {
    base: dirname(path),
    onDependency: (dependency) => {
      dependencies.add(dependency)
    },
  })
  const system = await __unstable__loadDesignSystem(css, { base: dirname(path) })
  const roots = new Set<string>(system.getClassList().map(([name]) => baseUtility(name).split('-')[0]))
  const hash = createHash('sha256')
  for (const dependency of [...dependencies].sort())
    hash.update(dependency).update(await readFile(dependency))
  const cache = new Map<string, string | null>()
  return {
    name: 'harlanzw/tailwind',
    files,
    ignores,
    plugins: { harlanzw: plugin },
    settings: {
      'harlanzw/tailwind': {
        stylesheet: path,
        fingerprint: hash.digest('hex'),
        classes: cssClasses(compiler.build([])),
        isUtility: (candidate: string) => system.parseCandidate(candidate).length > 0 || roots.has(candidate.split('-')[0]),
        compile(candidate: string) {
          if (!cache.has(candidate))
            cache.set(candidate, system.candidatesToCss([candidate])[0])
          return cache.get(candidate)!
        },
      },
    },
    rules: {
      'harlanzw/vue-valid-tailwind-classes': ['warn', { allow: policy.allow, strict }],
      'harlanzw/vue-prefer-theme-tokens': ['warn', policy],
    },
  }
}
