import type { Linter } from 'eslint'

/**
 * Overrides that were copy-pasted into every repo before this existed.
 *
 * Every rule here is set to `off`. Flat config ignores an `off` entry for a rule
 * whose plugin is not registered, so these blocks are safe without depending on
 * `@antfu/eslint-config` or any of the plugins it loads.
 */
export interface BaseOptions {
  /**
   * `lib` also turns off `ts/explicit-function-return-type`.
   *
   * @default 'lib'
   */
  type?: 'lib' | 'app'
  /**
   * Paths to ignore on top of the shared ignore set.
   */
  ignores?: string[]
  /**
   * What to do with `CLAUDE.md`, `AGENTS.md`, and the agent tool directories.
   *
   * `ignore` keeps them out of the lint run entirely, which is what most repos
   * did by hand. `lint` leaves them for the prompt configs to pick up.
   *
   * A global `ignores` block beats any `files`-scoped config, so ignoring these
   * here would silently stop the prompt rules from ever seeing them.
   * {@link harlanzw} passes `lint` whenever its prompt config is enabled.
   *
   * @default 'ignore'
   */
  agentFiles?: 'ignore' | 'lint'
}

// Globs are recursive: monorepo packages carry their own playground, fixtures,
// and agent files, and a root-anchored glob misses every nested copy.
const AGENT_IGNORES = [
  '**/CLAUDE.md',
  '**/AGENTS.md',
  '**/.claude/**',
  '**/.cursor/**',
]

/** Ignored everywhere, whatever the agent file handling is. */
const BASE_IGNORES = [
  '**/.data/**',
  '**/test/fixtures/**',
  '**/fixtures/**',
  '**/playground/**',
  '**/worker-configuration.d.ts',
]

const TEST_FILES = [
  '**/*.{test,spec}.{ts,tsx,js,jsx,mts,mjs}',
  '**/test/**/*.{ts,tsx,js,jsx,mts,mjs}',
  '**/tests/**/*.{ts,tsx,js,jsx,mts,mjs}',
]

/** Code fences in markdown are illustrative, so most style and safety rules do not apply. */
const MARKDOWN_CODE_FILES = ['**/*.md/**']

/** Example apps pin real versions on purpose, so workspace catalog rules do not apply. */
const EXAMPLE_MANIFESTS = ['examples/**/package.json']

/**
 * Shared flat config blocks.
 *
 * Spread these after the preset whose rules they turn off.
 */
export function base(options: BaseOptions = {}): Linter.Config[] {
  const { type = 'lib', ignores = [], agentFiles = 'ignore' } = options

  const rules: Linter.RulesRecord = {
    'no-use-before-define': 'off',
    'ts/no-use-before-define': 'off',
    'node/prefer-global/process': 'off',
    'node/prefer-global/buffer': 'off',
  }
  if (type === 'lib') {
    rules['ts/explicit-function-return-type'] = 'off'
  }

  return [
    {
      name: 'harlanzw/base/ignores',
      ignores: [
        ...BASE_IGNORES,
        ...(agentFiles === 'ignore' ? AGENT_IGNORES : []),
        ...ignores,
      ],
    },
    {
      name: 'harlanzw/base/rules',
      rules,
    },
    {
      name: 'harlanzw/base/tests',
      files: TEST_FILES,
      rules: {
        'no-console': 'off',
        'ts/no-unsafe-function-type': 'off',
        'antfu/no-top-level-await': 'off',
        'e18e/prefer-static-regex': 'off',
      },
    },
    {
      name: 'harlanzw/base/markdown',
      files: MARKDOWN_CODE_FILES,
      rules: {
        'no-console': 'off',
        'no-tabs': 'off',
        'style/no-tabs': 'off',
        'style/max-statements-per-line': 'off',
        'e18e/prefer-static-regex': 'off',
        'unused-imports/no-unused-vars': 'off',
      },
    },
    {
      name: 'harlanzw/base/examples',
      files: EXAMPLE_MANIFESTS,
      rules: {
        'pnpm/json-enforce-catalog': 'off',
        'pnpm/json-valid-catalog': 'off',
        'pnpm/json-prefer-workspace-settings': 'off',
      },
    },
  ]
}
