import type { ESLint, Linter } from 'eslint'
import { version } from '../package.json'
import vueNoFauxComposables from './rules/vue-no-faux-composables'
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
    'vue-no-faux-composables': vueNoFauxComposables,
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
