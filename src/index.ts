import type { ESLint, Linter } from 'eslint'
import { version } from '../package.json'
import nuxtAwaitNavigateTo from './rules/nuxt-await-navigate-to'
import nuxtNoSideEffectsInAsyncDataHandler from './rules/nuxt-no-side-effects-in-async-data-handler'
import nuxtNoSideEffectsInSetup from './rules/nuxt-no-side-effects-in-setup'
import nuxtPreferNavigateToOverRouterPushReplace from './rules/nuxt-prefer-navigate-to-over-router-push-replace'
import vueNoFauxComposables from './rules/vue-no-faux-composables'
import vueNoNestedReactivity from './rules/vue-no-nested-reactivity'
import vueNoPassingRefsAsProps from './rules/vue-no-passing-refs-as-props'
import vueNoRefAccessInTemplates from './rules/vue-no-ref-access-in-templates'
import vueNoTorefsOnProps from './rules/vue-no-torefs-on-props'

const plugin = {
  meta: {
    name: 'harlanzw',
    version,
  },
  // @keep-sorted
  rules: {
    'nuxt-await-navigate-to': nuxtAwaitNavigateTo,
    'nuxt-no-side-effects-in-async-data-handler': nuxtNoSideEffectsInAsyncDataHandler,
    'nuxt-no-side-effects-in-setup': nuxtNoSideEffectsInSetup,
    'nuxt-prefer-navigate-to-over-router-push-replace': nuxtPreferNavigateToOverRouterPushReplace,
    'vue-no-faux-composables': vueNoFauxComposables,
    'vue-no-nested-reactivity': vueNoNestedReactivity,
    'vue-no-passing-refs-as-props': vueNoPassingRefsAsProps,
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
