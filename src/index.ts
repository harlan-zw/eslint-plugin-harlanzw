import type { ESLint, Linter } from 'eslint'
import type { LinkRuleOptions } from './link-utils'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'
import { version } from '../package.json'
import { PROMPT_FILES, SKILL_FILES } from './prompt/constants'
import { CONTENT_FILES } from './prompt/deslop-constants'
import { PromptLanguage } from './prompt/language'
import promptAmbiguousQuantifier from './prompt/rules/ambiguous-quantifier'
import aiDeslopAdverbs from './prompt/rules/deslop-adverbs'
import aiDeslopAutolink from './prompt/rules/deslop-autolink'
import aiDeslopBuzzwords from './prompt/rules/deslop-buzzwords'
import aiDeslopCasing from './prompt/rules/deslop-casing'
import aiDeslopCodeLang from './prompt/rules/deslop-code-lang'
import aiDeslopFiller from './prompt/rules/deslop-filler'
import aiDeslopHedging from './prompt/rules/deslop-hedging'
import aiDeslopNoExclamation from './prompt/rules/deslop-no-exclamation'
import aiDeslopPassiveVoice from './prompt/rules/deslop-passive-voice'
import aiDeslopWeakOpener from './prompt/rules/deslop-weak-opener'
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
import nuxtNoRandom from './rules/nuxt-no-random'
import nuxtNoRedundantImportMeta from './rules/nuxt-no-redundant-import-meta'
import nuxtNoSideEffectsInAsyncDataHandler from './rules/nuxt-no-side-effects-in-async-data-handler'
import nuxtNoSideEffectsInSetup from './rules/nuxt-no-side-effects-in-setup'
import nuxtNoUnsafeDate from './rules/nuxt-no-unsafe-date'
import nuxtPreferNavigateToOverRouterPushReplace from './rules/nuxt-prefer-navigate-to-over-router-push-replace'
import nuxtPreferNuxtLinkOverRouterLink from './rules/nuxt-prefer-nuxt-link-over-router-link'
import vueNoFauxComposables from './rules/vue-no-faux-composables'
import vueNoNestedReactivity from './rules/vue-no-nested-reactivity'
import vueNoPassingRefsAsProps from './rules/vue-no-passing-refs-as-props'
import vueNoReactiveDestructuring from './rules/vue-no-reactive-destructuring'
import vueNoRefAccessInTemplates from './rules/vue-no-ref-access-in-templates'
import vueNoTorefsOnProps from './rules/vue-no-torefs-on-props'
import vueRequireComposablePrefix from './rules/vue-require-composable-prefix'

const plugin: ESLint.Plugin = {
  meta: {
    name: 'harlanzw',
    version,
  },
  languages: {
    prompt: new PromptLanguage() as any,
  },
  // @keep-sorted
  rules: {
    'ai-deslop-adverbs': aiDeslopAdverbs,
    'ai-deslop-autolink': aiDeslopAutolink,
    'ai-deslop-buzzwords': aiDeslopBuzzwords,
    'ai-deslop-casing': aiDeslopCasing,
    'ai-deslop-code-lang': aiDeslopCodeLang,
    'ai-deslop-filler': aiDeslopFiller,
    'ai-deslop-hedging': aiDeslopHedging,
    'ai-deslop-no-exclamation': aiDeslopNoExclamation,
    'ai-deslop-passive-voice': aiDeslopPassiveVoice,
    'ai-deslop-weak-opener': aiDeslopWeakOpener,
    'link-ascii-only': linkAsciiOnly,
    'link-lowercase': linkLowercase,
    'link-no-double-slashes': linkNoDoubleSlashes,
    'link-no-underscores': linkNoUnderscores,
    'link-no-whitespace': linkNoWhitespace,
    'link-require-descriptive-text': linkRequireDescriptiveText,
    'link-require-href': linkRequireHref,
    'link-trailing-slash': linkTrailingSlash,
    'nuxt-await-navigate-to': nuxtAwaitNavigateTo,
    'nuxt-no-random': nuxtNoRandom,
    'nuxt-no-redundant-import-meta': nuxtNoRedundantImportMeta,
    'nuxt-no-side-effects-in-async-data-handler': nuxtNoSideEffectsInAsyncDataHandler,
    'nuxt-no-side-effects-in-setup': nuxtNoSideEffectsInSetup,
    'nuxt-no-unsafe-date': nuxtNoUnsafeDate,
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
    'vue-require-composable-prefix': vueRequireComposablePrefix,
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

// Ignore AI agent directories from non-prompt rules
const CODE_IGNORES = ['.claude/**', '.cursor/**', '.github/copilot-instructions.md']

// AI deslop config: content markdown
const deslopRules: Record<string, Linter.RuleSeverity> = {
  'harlanzw/ai-deslop-buzzwords': 'error',
  'harlanzw/ai-deslop-casing': 'error',
  'harlanzw/ai-deslop-filler': 'error',
  'harlanzw/ai-deslop-adverbs': 'error',
  'harlanzw/ai-deslop-hedging': 'warn',
  'harlanzw/ai-deslop-no-exclamation': 'warn',
  'harlanzw/ai-deslop-passive-voice': 'warn',
  'harlanzw/ai-deslop-weak-opener': 'warn',
  'harlanzw/ai-deslop-autolink': 'warn',
  'harlanzw/ai-deslop-code-lang': 'warn',
}

plugin.configs!.content = [
  {
    name: 'harlanzw/content',
    files: CONTENT_FILES,
    ignores: CODE_IGNORES,
    language: 'harlanzw/prompt',
    plugins: { harlanzw: plugin },
    rules: deslopRules,
  },
]

// Link rules that accept LinkRuleOptions
const LINK_RULES_WITH_OPTIONS = [
  'link-ascii-only',
  'link-lowercase',
  'link-no-double-slashes',
  'link-no-underscores',
  'link-no-whitespace',
  'link-require-descriptive-text',
  'link-trailing-slash',
] as const

// Static configs (no options)
const LINK_FILES = ['**/*.vue', '**/*.jsx', '**/*.tsx']
plugin.configs!.link = [
  {
    name: 'harlanzw/link',
    files: LINK_FILES,
    ignores: CODE_IGNORES,
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
    ignores: CODE_IGNORES,
    plugins: { harlanzw: plugin },
    rules: {
      'harlanzw/nuxt-await-navigate-to': 'error',
      'harlanzw/nuxt-no-random': 'error',
      'harlanzw/nuxt-no-redundant-import-meta': 'error',
      'harlanzw/nuxt-no-side-effects-in-async-data-handler': 'error',
      'harlanzw/nuxt-no-side-effects-in-setup': 'error',
      'harlanzw/nuxt-no-unsafe-date': 'warn',
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
    ignores: CODE_IGNORES,
    plugins: { harlanzw: plugin },
    rules: {
      'harlanzw/vue-no-faux-composables': 'error',
      'harlanzw/vue-no-nested-reactivity': 'error',
      'harlanzw/vue-no-passing-refs-as-props': 'error',
      'harlanzw/vue-no-reactive-destructuring': 'error',
      'harlanzw/vue-no-ref-access-in-templates': 'warn',
      'harlanzw/vue-no-torefs-on-props': 'warn',
      'harlanzw/vue-require-composable-prefix': 'warn',
    },
  },
]

// Recommended config (all link + nuxt + vue rules)
plugin.configs!.recommended = [
  ...plugin.configs!.link,
  ...plugin.configs!.nuxt,
  ...plugin.configs!.vue,
]

// Factory options
export interface HarlanzwOptions {
  link?: boolean | LinkRuleOptions & { requireTrailingSlash?: boolean }
  nuxt?: boolean
  vue?: boolean
  prompt?: boolean | 'recommended' | 'strict' | 'skill'
  content?: boolean
}

const PROMPT_MARKERS = [
  '.claude',
  '.cursor',
  '.github/copilot-instructions.md',
  '.windsurfrules',
  '.clinerules',
  '.goose',
  '.amp',
  'CLAUDE.md',
  'AGENTS.md',
  '.cursorrules',
  '.gemini',
]

function buildLinkRules(linkOpts: LinkRuleOptions & { requireTrailingSlash?: boolean }): Record<string, Linter.RuleEntry> {
  const { requireTrailingSlash, ...baseOpts } = linkOpts
  const rules: Record<string, Linter.RuleEntry> = {
    'harlanzw/link-require-href': 'error',
  }
  for (const ruleName of LINK_RULES_WITH_OPTIONS) {
    const opts = ruleName === 'link-trailing-slash'
      ? { ...baseOpts, requireTrailingSlash }
      : baseOpts
    rules[`harlanzw/${ruleName}`] = ['warn', opts]
  }
  rules['harlanzw/link-no-double-slashes'] = ['error', baseOpts]
  return rules
}

/**
 * Create ESLint flat configs for harlanzw rules.
 *
 * @example
 * ```ts
 * import harlanzw from 'eslint-plugin-harlanzw'
 *
 * export default harlanzw({
 *   link: { ignoreExternal: true },
 *   nuxt: true,
 *   vue: true,
 * })
 * ```
 *
 * @example With extra configs (like antfu)
 * ```ts
 * export default harlanzw(
 *   { link: true, nuxt: true, vue: true },
 *   { rules: { 'harlanzw/link-lowercase': 'off' } },
 * )
 * ```
 */
function harlanzw(options: HarlanzwOptions = {}, ...extraConfigs: Linter.Config[]): Linter.Config[] {
  const detected = detectFramework()
  const configs: Linter.Config[] = []

  if (options.link !== false) {
    const linkOpts = typeof options.link === 'object' ? options.link : {}
    configs.push({
      name: 'harlanzw/link',
      files: LINK_FILES,
      ignores: CODE_IGNORES,
      plugins: { harlanzw: plugin },
      rules: buildLinkRules(linkOpts),
    })
  }

  const enablePrompt = options.prompt ?? detected.prompt
  if (enablePrompt) {
    const preset = typeof options.prompt === 'string' ? options.prompt : 'recommended'
    configs.push(...plugin.configs![`prompt:${preset}`] as Linter.Config[])
  }

  const enableNuxt = options.nuxt ?? detected.nuxt
  if (enableNuxt) {
    configs.push(...plugin.configs!.nuxt as Linter.Config[])
  }

  const enableVue = options.vue ?? detected.vue
  if (enableVue) {
    configs.push(...plugin.configs!.vue as Linter.Config[])
  }

  const enableContent = options.content ?? detected.content
  if (enableContent) {
    configs.push(...plugin.configs!.content as Linter.Config[])
  }

  configs.push(...extraConfigs)

  return configs
}

function detectFramework(): { nuxt: boolean, vue: boolean, prompt: boolean, content: boolean } {
  const cwd = process.cwd()
  const nuxt = existsSync(resolve(cwd, 'nuxt.config.ts')) || existsSync(resolve(cwd, 'nuxt.config.js'))
  let vue = nuxt
  if (!vue) {
    try {
      const pkg = JSON.parse(readFileSync(resolve(cwd, 'package.json'), 'utf-8'))
      const deps = { ...pkg.dependencies, ...pkg.devDependencies }
      vue = !!(deps.vue || deps.nuxt)
    }
    catch {}
  }
  const prompt = PROMPT_MARKERS.some(m => existsSync(resolve(cwd, m)))
  const content = existsSync(resolve(cwd, 'content')) || existsSync(resolve(cwd, 'docs'))
  return { nuxt, vue, prompt, content }
}

// Attach plugin to factory and export both
harlanzw.plugin = plugin
harlanzw.detectFramework = detectFramework

export { plugin }
export default harlanzw

type RuleDefinitions = typeof plugin['rules']

export type RuleOptions = {
  [K in keyof RuleDefinitions]: RuleDefinitions[K] extends { defaultOptions: infer D } ? D : []
}

export type Rules = {
  [K in keyof RuleOptions]: Linter.RuleEntry<RuleOptions[K]>
}
