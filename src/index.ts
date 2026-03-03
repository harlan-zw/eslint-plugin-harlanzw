import type { ESLint, Linter } from 'eslint'
import { version } from '../package.json'
import { PROMPT_FILES, SKILL_FILES } from './prompt/constants'
import { PromptLanguage } from './prompt/language'
import promptAmbiguousQuantifier from './prompt/rules/ambiguous-quantifier'
import promptDuplicateHeading from './prompt/rules/duplicate-heading'
import promptEmptySection from './prompt/rules/empty-section'
import promptEmptyVariable from './prompt/rules/empty-variable'
import promptExampleMismatch from './prompt/rules/example-mismatch'
import promptInefficientToken from './prompt/rules/inefficient-token'
import promptInstructionDilution from './prompt/rules/instruction-dilution'
import promptLargePrompt from './prompt/rules/large-prompt'
import promptMissingExamples from './prompt/rules/missing-examples'
import promptMixedConventions from './prompt/rules/mixed-conventions'
import promptNoTrailingSpaces from './prompt/rules/no-trailing-spaces'
import promptRedundantInstruction from './prompt/rules/redundant-instruction'
import promptSkillFrontmatterRequired from './prompt/rules/skill-frontmatter-required'
import promptSkillFrontmatterSchema from './prompt/rules/skill-frontmatter-schema'
import promptSubsumedConstraint from './prompt/rules/subsumed-constraint'
import promptUnclosedCodeFence from './prompt/rules/unclosed-code-fence'
import promptUnclosedTag from './prompt/rules/unclosed-tag'
import promptUndefinedVariable from './prompt/rules/undefined-variable'
import promptUnresolvedReference from './prompt/rules/unresolved-reference'
import promptVagueTerm from './prompt/rules/vague-term'
import promptWeakInstruction from './prompt/rules/weak-instruction'
import linkAsciiOnly from './rules/link-ascii-only'
import linkLowercase from './rules/link-lowercase'
import linkNoDoubleSlashes from './rules/link-no-double-slashes'
import linkNoUnderscores from './rules/link-no-underscores'
import linkNoWhitespace from './rules/link-no-whitespace'
import linkRequireDescriptiveText from './rules/link-require-descriptive-text'
import linkRequireHref from './rules/link-require-href'
import linkTrailingSlash from './rules/link-trailing-slash'
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

const plugin: ESLint.Plugin = {
  meta: {
    name: 'harlanzw',
    version,
  },
  languages: {
    prompt: new PromptLanguage(),
  },
  // @keep-sorted
  rules: {
    'link-ascii-only': linkAsciiOnly,
    'link-lowercase': linkLowercase,
    'link-no-double-slashes': linkNoDoubleSlashes,
    'link-no-underscores': linkNoUnderscores,
    'link-no-whitespace': linkNoWhitespace,
    'link-require-descriptive-text': linkRequireDescriptiveText,
    'link-require-href': linkRequireHref,
    'link-trailing-slash': linkTrailingSlash,
    'nuxt-await-navigate-to': nuxtAwaitNavigateTo,
    'nuxt-no-redundant-import-meta': nuxtNoRedundantImportMeta,
    'nuxt-no-side-effects-in-async-data-handler': nuxtNoSideEffectsInAsyncDataHandler,
    'nuxt-no-side-effects-in-setup': nuxtNoSideEffectsInSetup,
    'nuxt-prefer-navigate-to-over-router-push-replace': nuxtPreferNavigateToOverRouterPushReplace,
    'nuxt-prefer-nuxt-link-over-router-link': nuxtPreferNuxtLinkOverRouterLink,
    'prompt-ambiguous-quantifier': promptAmbiguousQuantifier,
    'prompt-duplicate-heading': promptDuplicateHeading,
    'prompt-empty-section': promptEmptySection,
    'prompt-empty-variable': promptEmptyVariable,
    'prompt-example-mismatch': promptExampleMismatch,
    'prompt-inefficient-token': promptInefficientToken,
    'prompt-instruction-dilution': promptInstructionDilution,
    'prompt-large-prompt': promptLargePrompt,
    'prompt-missing-examples': promptMissingExamples,
    'prompt-mixed-conventions': promptMixedConventions,
    'prompt-no-trailing-spaces': promptNoTrailingSpaces,
    'prompt-redundant-instruction': promptRedundantInstruction,
    'prompt-skill-frontmatter-required': promptSkillFrontmatterRequired,
    'prompt-skill-frontmatter-schema': promptSkillFrontmatterSchema,
    'prompt-subsumed-constraint': promptSubsumedConstraint,
    'prompt-unclosed-code-fence': promptUnclosedCodeFence,
    'prompt-unclosed-tag': promptUnclosedTag,
    'prompt-undefined-variable': promptUndefinedVariable,
    'prompt-unresolved-reference': promptUnresolvedReference,
    'prompt-vague-term': promptVagueTerm,
    'prompt-weak-instruction': promptWeakInstruction,
    'vue-no-faux-composables': vueNoFauxComposables,
    'vue-no-nested-reactivity': vueNoNestedReactivity,
    'vue-no-passing-refs-as-props': vueNoPassingRefsAsProps,
    'vue-no-reactive-destructuring': vueNoReactiveDestructuring,
    'vue-no-ref-access-in-templates': vueNoRefAccessInTemplates,
    'vue-no-torefs-on-props': vueNoTorefsOnProps,
  },
  configs: {} as Record<string, Linter.Config[]>,
}

// Prompt config: recommended
const promptRecommendedRules: Record<string, Linter.RuleSeverity> = {
  'harlanzw/prompt-weak-instruction': 'warn',
  'harlanzw/prompt-instruction-dilution': 'warn',
  'harlanzw/prompt-ambiguous-quantifier': 'warn',
  'harlanzw/prompt-vague-term': 'warn',
  'harlanzw/prompt-unresolved-reference': 'warn',
  'harlanzw/prompt-mixed-conventions': 'warn',
  'harlanzw/prompt-unclosed-code-fence': 'error',
  'harlanzw/prompt-unclosed-tag': 'error',
  'harlanzw/prompt-duplicate-heading': 'warn',
  'harlanzw/prompt-empty-section': 'warn',
  'harlanzw/prompt-redundant-instruction': 'warn',
  'harlanzw/prompt-subsumed-constraint': 'warn',
  'harlanzw/prompt-missing-examples': 'warn',
  'harlanzw/prompt-example-mismatch': 'warn',
  'harlanzw/prompt-empty-variable': 'error',
  'harlanzw/prompt-undefined-variable': 'warn',
  'harlanzw/prompt-large-prompt': 'warn',
}

plugin.configs!['prompt:recommended'] = [
  {
    name: 'harlanzw/prompt-recommended',
    files: PROMPT_FILES,
    language: 'harlanzw/prompt',
    plugins: { harlanzw: plugin },
    rules: promptRecommendedRules,
  },
]

// Prompt config: strict
plugin.configs!['prompt:strict'] = [
  {
    name: 'harlanzw/prompt-strict',
    files: PROMPT_FILES,
    language: 'harlanzw/prompt',
    plugins: { harlanzw: plugin },
    rules: {
      ...promptRecommendedRules,
      'harlanzw/prompt-weak-instruction': 'error',
      'harlanzw/prompt-ambiguous-quantifier': 'error',
      'harlanzw/prompt-vague-term': 'error',
      'harlanzw/prompt-inefficient-token': 'warn',
      'harlanzw/prompt-no-trailing-spaces': 'warn',
    },
  },
]

// Prompt config: skill
plugin.configs!['prompt:skill'] = [
  ...plugin.configs!['prompt:recommended'],
  {
    name: 'harlanzw/prompt-skill',
    files: SKILL_FILES,
    language: 'harlanzw/prompt',
    plugins: { harlanzw: plugin },
    rules: {
      ...promptRecommendedRules,
      'harlanzw/prompt-skill-frontmatter-required': 'error',
      'harlanzw/prompt-skill-frontmatter-schema': 'error',
    },
  },
]

// Link config
const LINK_FILES = ['**/*.vue', '**/*.jsx', '**/*.tsx']
plugin.configs!.link = [
  {
    name: 'harlanzw/link',
    files: LINK_FILES,
    plugins: { harlanzw: plugin },
    rules: {
      'harlanzw/link-ascii-only': 'warn',
      'harlanzw/link-lowercase': 'warn',
      'harlanzw/link-no-double-slashes': 'error',
      'harlanzw/link-no-underscores': 'warn',
      'harlanzw/link-no-whitespace': 'warn',
      'harlanzw/link-require-descriptive-text': 'warn',
      'harlanzw/link-require-href': 'error',
      'harlanzw/link-trailing-slash': 'warn',
    },
  },
]

// Nuxt config
const NUXT_VUE_FILES = ['**/*.vue', '**/*.ts', '**/*.jsx', '**/*.tsx']
plugin.configs!.nuxt = [
  {
    name: 'harlanzw/nuxt',
    files: NUXT_VUE_FILES,
    plugins: { harlanzw: plugin },
    rules: {
      'harlanzw/nuxt-await-navigate-to': 'error',
      'harlanzw/nuxt-no-redundant-import-meta': 'error',
      'harlanzw/nuxt-no-side-effects-in-async-data-handler': 'error',
      'harlanzw/nuxt-no-side-effects-in-setup': 'error',
      'harlanzw/nuxt-prefer-navigate-to-over-router-push-replace': 'warn',
      'harlanzw/nuxt-prefer-nuxt-link-over-router-link': 'warn',
    },
  },
]

// Vue config
plugin.configs!.vue = [
  {
    name: 'harlanzw/vue',
    files: NUXT_VUE_FILES,
    plugins: { harlanzw: plugin },
    rules: {
      'harlanzw/vue-no-faux-composables': 'error',
      'harlanzw/vue-no-nested-reactivity': 'error',
      'harlanzw/vue-no-passing-refs-as-props': 'error',
      'harlanzw/vue-no-reactive-destructuring': 'error',
      'harlanzw/vue-no-ref-access-in-templates': 'warn',
      'harlanzw/vue-no-torefs-on-props': 'warn',
    },
  },
]

// Recommended config (all link + nuxt + vue rules)
plugin.configs!.recommended = [
  ...plugin.configs!.link,
  ...plugin.configs!.nuxt,
  ...plugin.configs!.vue,
]

export default plugin

type RuleDefinitions = typeof plugin['rules']

export type RuleOptions = {
  [K in keyof RuleDefinitions]: RuleDefinitions[K] extends { defaultOptions: infer D } ? D : []
}

export type Rules = {
  [K in keyof RuleOptions]: Linter.RuleEntry<RuleOptions[K]>
}
