import harlanzw from 'eslint-plugin-harlanzw'
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt([{
  plugins: {
    harlanzw,
  },
  rules: {
    'harlanzw/link-ascii-only': 'error',
    'harlanzw/link-lowercase': 'error',
    'harlanzw/link-no-double-slashes': 'error',
    'harlanzw/link-no-whitespace': 'error',
    'harlanzw/nuxt-await-navigate-to': 'error',
    'harlanzw/nuxt-no-redundant-import-meta': 'error',
    'harlanzw/nuxt-no-side-effects-in-async-data-handler': 'error',
    'harlanzw/nuxt-no-side-effects-in-setup': 'warn',
    'harlanzw/nuxt-prefer-navigate-to-over-router-push-replace': 'error',
    'harlanzw/nuxt-prefer-nuxt-link-over-router-link': 'error',
    'harlanzw/vue-no-faux-composables': 'error',
    'harlanzw/vue-no-nested-reactivity': 'error',
    'harlanzw/vue-no-passing-refs-as-props': 'error',
    'harlanzw/vue-no-reactive-destructuring': 'error',
    'harlanzw/vue-no-ref-access-in-templates': 'error',
    'harlanzw/vue-no-torefs-on-props': 'error',
  },
}])
