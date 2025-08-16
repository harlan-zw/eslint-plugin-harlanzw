import antfu from '@antfu/eslint-config'
import { tsImport } from 'tsx/esm/api'
import * as parserVue from 'vue-eslint-parser'

const local = await tsImport('./src/index.ts', import.meta.url).then(r => r.default)

// eslint-disable-next-line node/prefer-global/process
const devOnly = process.env.TEST_SELF ? 'error' : 'off'

export default antfu(
  {
    type: 'lib',
  },
  {
    // ignores: ['vendor'],
    plugins: { harlanzw: local },
  },
  {
    files: ['fixtures/**/*.ts'],
    rules: {
      'no-unused-vars': 'off',
      'unused-imports/no-unused-vars': 'off',
      'ts/explicit-function-return-type': 'off',
      'harlanzw/vue-no-faux-composables': devOnly,
    },
  },
  // for testing
  {
    files: ['fixtures/**/*.vue'],
    languageOptions: {
      parser: parserVue,
    },
    rules: {
      'harlanzw/vue-no-faux-composables': devOnly,
      'harlanzw/vue-no-ref-access-in-templates': devOnly,
      'harlanzw/vue-no-passing-refs-as-props': devOnly,
      'harlanzw/vue-no-torefs-on-props': devOnly,
      'harlanzw/vue-no-nested-reactivity': devOnly,
    },
  },
  {
    rules: {
      'ts/explicit-function-return-type': 'off',
    },
  },
)
