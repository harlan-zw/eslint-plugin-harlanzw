import antfu from '@antfu/eslint-config'
import { tsImport } from 'tsx/esm/api'
import * as parserVue from 'vue-eslint-parser'

const local = await tsImport('./src/index.ts', import.meta.url).then(r => r.default)

export default antfu(
  {
    type: 'lib',
  },
  {
    ignores: ['playground/**'],
    plugins: { harlanzw: local },
  },
  {
    files: ['fixtures/**/*.ts'],
    rules: {
      'no-unused-vars': 'off',
      'unused-imports/no-unused-vars': 'off',
      'ts/explicit-function-return-type': 'off',
      'harlanzw/vue-no-faux-composables': 'error',
      'harlanzw/vue-no-nested-reactivity': 'error',
    },
  },
  // for testing
  {
    files: ['fixtures/**/*.vue'],
    languageOptions: {
      parser: parserVue,
    },
    rules: {
      'harlanzw/vue-no-faux-composables': 'error',
      'harlanzw/vue-no-ref-access-in-templates': 'error',
      'harlanzw/vue-no-passing-refs-as-props': 'error',
      'harlanzw/vue-no-torefs-on-props': 'error',
      'harlanzw/vue-no-nested-reactivity': 'error',
    },
  },
  {
    rules: {
      'ts/explicit-function-return-type': 'off',
    },
  },
)
