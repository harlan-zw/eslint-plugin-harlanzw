import harlanzw from 'eslint-plugin-harlanzw'
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt([{
  plugins: {
    harlanzw,
  },
  rules: {
    'harlanzw/nuxt-await-navigate-to': 'error',
    'harlanzw/vue-no-faux-composables': 'error',
    'harlanzw/vue-no-nested-reactivity': 'error',
    'harlanzw/vue-no-passing-refs-as-props': 'error',
    'harlanzw/vue-no-ref-access-in-templates': 'error',
    'harlanzw/vue-no-torefs-on-props': 'error',
  },
}])
