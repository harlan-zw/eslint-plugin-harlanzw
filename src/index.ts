import type { ESLint, Linter } from 'eslint'
import { version } from '../package.json'
import linkAsciiOnly from './rules/link-ascii-only'
import linkLowercase from './rules/link-lowercase'
import linkNoDoubleSlashes from './rules/link-no-double-slashes'
import linkNoWhitespace from './rules/link-no-whitespace'
import nuxtAwaitNavigateTo from './rules/nuxt-await-navigate-to'
import nuxtNoRedundantImportMeta from './rules/nuxt-no-redundant-import-meta'
import nuxtNoSideEffectsInAsyncDataHandler from './rules/nuxt-no-side-effects-in-async-data-handler'
import nuxtNoSideEffectsInSetup from './rules/nuxt-no-side-effects-in-setup'
import nuxtPreferNavigateToOverRouterPushReplace from './rules/nuxt-prefer-navigate-to-over-router-push-replace'
import nuxtPreferNuxtLinkOverRouterLink from './rules/nuxt-prefer-nuxt-link-over-router-link'
import vueNoFauxComposables from './rules/vue-no-faux-composables'
import vueNoNestedReactivity from './rules/vue-no-nested-reactivity'
import vueNoPassingRefsAsProps from './rules/vue-no-passing-refs-as-props'
import vueNoReactiveDestructuring from './rules/vue-no-reactive-destructuring'
import vueNoRefAccessInTemplates from './rules/vue-no-ref-access-in-templates'
import vueNoTorefsOnProps from './rules/vue-no-torefs-on-props'

const plugin = {
  meta: {
    name: 'harlanzw',
    version,
  },
  // @keep-sorted
  rules: {
    'link-ascii-only': linkAsciiOnly,
    'link-lowercase': linkLowercase,
    'link-no-double-slashes': linkNoDoubleSlashes,
    'link-no-whitespace': linkNoWhitespace,
    'nuxt-await-navigate-to': nuxtAwaitNavigateTo,
    'nuxt-no-redundant-import-meta': nuxtNoRedundantImportMeta,
    'nuxt-no-side-effects-in-async-data-handler': nuxtNoSideEffectsInAsyncDataHandler,
    'nuxt-no-side-effects-in-setup': nuxtNoSideEffectsInSetup,
    'nuxt-prefer-navigate-to-over-router-push-replace': nuxtPreferNavigateToOverRouterPushReplace,
    'nuxt-prefer-nuxt-link-over-router-link': nuxtPreferNuxtLinkOverRouterLink,
    'vue-no-faux-composables': vueNoFauxComposables,
    'vue-no-nested-reactivity': vueNoNestedReactivity,
    'vue-no-passing-refs-as-props': vueNoPassingRefsAsProps,
    'vue-no-reactive-destructuring': vueNoReactiveDestructuring,
    'vue-no-ref-access-in-templates': vueNoRefAccessInTemplates,
    'vue-no-torefs-on-props': vueNoTorefsOnProps,
  },
} satisfies ESLint.Plugin

export default plugin

type RuleDefinitions = typeof plugin['rules']

export type RuleOptions = {
  [K in keyof RuleDefinitions]: RuleDefinitions[K]['defaultOptions']
}

export type Rules = {
  [K in keyof RuleOptions]: Linter.RuleEntry<RuleOptions[K]>
}
