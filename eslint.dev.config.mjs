import antfu from '@antfu/eslint-config'
import { tsImport } from 'tsx/esm/api'

const local = await tsImport('./src/index.ts', import.meta.url).then(r => r.default)

export default antfu(
  {
    type: 'lib',
  },
  {
    ignores: ['playground/**'],
  },
  ...local.configs.recommended,
  {
    files: ['fixtures/**/*.ts'],
    rules: {
      'no-unused-vars': 'off',
      'unused-imports/no-unused-vars': 'off',
      'ts/explicit-function-return-type': 'off',
    },
  },
  {
    rules: {
      'ts/explicit-function-return-type': 'off',
    },
  },
)
