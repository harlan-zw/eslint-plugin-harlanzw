import antfu from '@antfu/eslint-config'
import { tsImport } from 'tsx/esm/api'
import * as parserVue from 'vue-eslint-parser'

const local = await tsImport('./src/index.ts', import.meta.url).then(r => r.default)

export default antfu(
  {
    type: 'lib',
  },
  {
    // ignores: ['vendor'],
    plugins: { harlanzw: local },
  },
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: parserVue,
    },
    rules: {
      'harlanzw/vue-no-ref-access-in-templates': 'error',
      'harlanzw/vue-no-passing-refs-as-props': 'error',
      'harlanzw/vue-no-torefs-on-props': 'error',
    },
  },
  {
    files: ['fixtures/**/*.ts'],
    rules: {
      'harlanzw/vue-no-faux-composables': 'error',
      // Disable other rules that might interfere with testing
      'no-unused-vars': 'off',
      'unused-imports/no-unused-vars': 'off',
      'ts/explicit-function-return-type': 'off',
    },
  },
  {
    rules: {
      'ts/explicit-function-return-type': 'off',
      // for testing - enable all rules
      'harlanzw/vue-no-faux-composables': 'error',
      'harlanzw/vue-no-ref-access-in-templates': 'error',
      'harlanzw/vue-no-passing-refs-as-props': 'error',
      'harlanzw/vue-no-torefs-on-props': 'error',
    },
  },
)
