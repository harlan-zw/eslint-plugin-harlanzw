import antfu from '@antfu/eslint-config'
// Dogfood the shared base from this package (requires `pnpm dev` for the stub build).
// eslint-disable-next-line antfu/no-import-dist
import { base } from './dist/index.mjs'

export default antfu(
  {
    type: 'lib',
    markdown: {
      overrides: {
        'markdown/no-html': 'off',
      },
    },
  },
  // Rule docs contain multi-root Vue/JSX examples that antfu's markdown pass cannot parse.
  ...base({ ignores: ['src/rules/*.md'] }),
  {
    files: ['src/prompt/**/*.ts'],
    rules: {
      'no-cond-assign': 'off',
    },
  },
)
