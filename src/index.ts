import type { ESLint, Linter } from 'eslint'
import type { BaseOptions } from './base'
import type { LinkRuleOptions } from './link-utils'
import type { NuxtUiDesignOptions } from './rules/nuxt-ui-no-restyle'
import type { ThemeTokenOptions } from './rules/vue-prefer-theme-tokens'
import type { ValidClassOptions } from './rules/vue-valid-tailwind-classes'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'
import { version } from '../package.json'
import { base, TEST_FILES } from './base'
import { PROMPT_FILES, SKILL_FILES } from './prompt/constants'
import { CONTENT_FILES, DOCS_ROOT_FILES, DOCS_TREE_FILES, NUXT_CONTENT_FILES } from './prompt/deslop-constants'
import { PromptLanguage } from './prompt/language'
import promptAmbiguousQuantifier from './prompt/rules/ambiguous-quantifier'
import aiDeslopAdverbs from './prompt/rules/deslop-adverbs'
import aiDeslopAutolink from './prompt/rules/deslop-autolink'
import aiDeslopBuzzwords from './prompt/rules/deslop-buzzwords'
import aiDeslopCasing from './prompt/rules/deslop-casing'
import aiDeslopCodeLang from './prompt/rules/deslop-code-lang'
import aiDeslopFalseDichotomy from './prompt/rules/deslop-false-dichotomy'
import aiDeslopFalseSincerity from './prompt/rules/deslop-false-sincerity'
import aiDeslopFiller from './prompt/rules/deslop-filler'
import aiDeslopFrontmatterSpacing from './prompt/rules/deslop-frontmatter-spacing'
import aiDeslopHedging from './prompt/rules/deslop-hedging'
import aiDeslopNoEmDash from './prompt/rules/deslop-no-em-dash'
import aiDeslopNoExclamation from './prompt/rules/deslop-no-exclamation'
import aiDeslopPassiveVoice from './prompt/rules/deslop-passive-voice'
import aiDeslopVueTsLang from './prompt/rules/deslop-vue-ts-lang'
import aiDeslopWeakOpener from './prompt/rules/deslop-weak-opener'
import docsReferenceNoStatus from './prompt/rules/docs-reference-no-status'
import docsRetiredPointer from './prompt/rules/docs-retired-pointer'
import docsRootAllowlist from './prompt/rules/docs-root-allowlist'
import docsWorkBriefContract from './prompt/rules/docs-work-brief-contract'
import promptDuplicateHeading from './prompt/rules/duplicate-heading'
import promptEmptySection from './prompt/rules/empty-section'
import promptEmptyVariable from './prompt/rules/empty-variable'
import promptExampleMismatch from './prompt/rules/example-mismatch'
import promptInefficientToken from './prompt/rules/inefficient-token'
import promptInstructionDilution from './prompt/rules/instruction-dilution'
import promptLargePrompt from './prompt/rules/large-prompt'
import promptMissingExamples from './prompt/rules/missing-examples'
import promptNoTrailingSpaces from './prompt/rules/no-trailing-spaces'
import pnpmRequireTrustPolicy from './prompt/rules/pnpm-require-trust-policy'
import promptDanglingPath from './prompt/rules/prompt-dangling-path'
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
import noSilentCatch from './rules/no-silent-catch'
import noTestFileReads from './rules/no-test-file-reads'
import nuxtAwaitNavigateTo from './rules/nuxt-await-navigate-to'
import nuxtNoRandom from './rules/nuxt-no-random'
import nuxtNoRedundantComponentImports from './rules/nuxt-no-redundant-component-imports'
import nuxtNoRedundantImportMeta from './rules/nuxt-no-redundant-import-meta'
import nuxtNoSelfLayerAlias from './rules/nuxt-no-self-layer-alias'
import nuxtNoSideEffectsInAsyncDataHandler from './rules/nuxt-no-side-effects-in-async-data-handler'
import nuxtNoSideEffectsInSetup from './rules/nuxt-no-side-effects-in-setup'
import nuxtNoUnsafeDate from './rules/nuxt-no-unsafe-date'
import nuxtPreferLayerAlias from './rules/nuxt-prefer-layer-alias'
import nuxtPreferNavigateToOverRouterPushReplace from './rules/nuxt-prefer-navigate-to-over-router-push-replace'
import nuxtPreferNuxtLinkOverRouterLink from './rules/nuxt-prefer-nuxt-link-over-router-link'
import nuxtUiNoRestyle from './rules/nuxt-ui-no-restyle'
import nuxtUiPreferShorthandCss from './rules/nuxt-ui-prefer-shorthand-css'
import preferNodeStyleText from './rules/prefer-node-style-text'
import preferSatisfies from './rules/prefer-satisfies'
import vueNoAsyncLifecycleHook from './rules/vue-no-async-lifecycle-hook'
import vueNoDynamicTailwindClasses from './rules/vue-no-dynamic-tailwind-classes'
import vueNoFauxComposables from './rules/vue-no-faux-composables'
import vueNoNestedReactivity from './rules/vue-no-nested-reactivity'
import vueNoPassingRefsAsProps from './rules/vue-no-passing-refs-as-props'
import vueNoReactiveDestructuring from './rules/vue-no-reactive-destructuring'
import vueNoReactivityAfterAwait from './rules/vue-no-reactivity-after-await'
import vueNoRefAccessInTemplates from './rules/vue-no-ref-access-in-templates'
import vueNoResolveComponentInComposables from './rules/vue-no-resolve-component-in-composables'
import vueNoTorefsOnProps from './rules/vue-no-torefs-on-props'
import vueNoUnresolvableDefineEmits from './rules/vue-no-unresolvable-define-emits'
import vuePreferDefineEmitsObjectSyntax from './rules/vue-prefer-define-emits-object-syntax'
import vuePreferThemeTokens from './rules/vue-prefer-theme-tokens'
import vueRequireComposablePrefix from './rules/vue-require-composable-prefix'
import vueValidTailwindClasses from './rules/vue-valid-tailwind-classes'

function defineRules<const TName extends string>(definitions: Record<TName, unknown>): Record<TName, unknown> {
  return definitions
}

// @keep-sorted
const rules = defineRules({
  'ai-deslop-adverbs': aiDeslopAdverbs,
  'ai-deslop-autolink': aiDeslopAutolink,
  'ai-deslop-buzzwords': aiDeslopBuzzwords,
  'ai-deslop-casing': aiDeslopCasing,
  'ai-deslop-code-lang': aiDeslopCodeLang,
  'ai-deslop-false-dichotomy': aiDeslopFalseDichotomy,
  'ai-deslop-false-sincerity': aiDeslopFalseSincerity,
  'ai-deslop-filler': aiDeslopFiller,
  'ai-deslop-frontmatter-spacing': aiDeslopFrontmatterSpacing,
  'ai-deslop-hedging': aiDeslopHedging,
  'ai-deslop-no-em-dash': aiDeslopNoEmDash,
  'ai-deslop-no-exclamation': aiDeslopNoExclamation,
  'ai-deslop-passive-voice': aiDeslopPassiveVoice,
  'ai-deslop-vue-ts-lang': aiDeslopVueTsLang,
  'ai-deslop-weak-opener': aiDeslopWeakOpener,
  'docs-reference-no-status': docsReferenceNoStatus,
  'docs-retired-pointer': docsRetiredPointer,
  'docs-root-allowlist': docsRootAllowlist,
  'docs-work-brief-contract': docsWorkBriefContract,
  'link-ascii-only': linkAsciiOnly,
  'link-lowercase': linkLowercase,
  'link-no-double-slashes': linkNoDoubleSlashes,
  'link-no-underscores': linkNoUnderscores,
  'link-no-whitespace': linkNoWhitespace,
  'link-require-descriptive-text': linkRequireDescriptiveText,
  'link-require-href': linkRequireHref,
  'link-trailing-slash': linkTrailingSlash,
  'no-silent-catch': noSilentCatch,
  'no-test-file-reads': noTestFileReads,
  'nuxt-await-navigate-to': nuxtAwaitNavigateTo,
  'nuxt-no-random': nuxtNoRandom,
  'nuxt-no-redundant-component-imports': nuxtNoRedundantComponentImports,
  'nuxt-no-redundant-import-meta': nuxtNoRedundantImportMeta,
  'nuxt-no-self-layer-alias': nuxtNoSelfLayerAlias,
  'nuxt-no-side-effects-in-async-data-handler': nuxtNoSideEffectsInAsyncDataHandler,
  'nuxt-no-side-effects-in-setup': nuxtNoSideEffectsInSetup,
  'nuxt-no-unsafe-date': nuxtNoUnsafeDate,
  'nuxt-prefer-layer-alias': nuxtPreferLayerAlias,
  'nuxt-prefer-navigate-to-over-router-push-replace': nuxtPreferNavigateToOverRouterPushReplace,
  'nuxt-prefer-nuxt-link-over-router-link': nuxtPreferNuxtLinkOverRouterLink,
  'nuxt-ui-no-restyle': nuxtUiNoRestyle,
  'nuxt-ui-prefer-shorthand-css': nuxtUiPreferShorthandCss,
  'pnpm-require-trust-policy': pnpmRequireTrustPolicy,
  'prefer-node-style-text': preferNodeStyleText,
  'prefer-satisfies': preferSatisfies,
  'prompt-ambiguous-quantifier': promptAmbiguousQuantifier,
  'prompt-dangling-path': promptDanglingPath,
  'prompt-duplicate-heading': promptDuplicateHeading,
  'prompt-empty-section': promptEmptySection,
  'prompt-empty-variable': promptEmptyVariable,
  'prompt-example-mismatch': promptExampleMismatch,
  'prompt-inefficient-token': promptInefficientToken,
  'prompt-instruction-dilution': promptInstructionDilution,
  'prompt-large-prompt': promptLargePrompt,
  'prompt-missing-examples': promptMissingExamples,
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
  'vue-no-async-lifecycle-hook': vueNoAsyncLifecycleHook,
  'vue-no-dynamic-tailwind-classes': vueNoDynamicTailwindClasses,
  'vue-no-faux-composables': vueNoFauxComposables,
  'vue-no-nested-reactivity': vueNoNestedReactivity,
  'vue-no-passing-refs-as-props': vueNoPassingRefsAsProps,
  'vue-no-reactive-destructuring': vueNoReactiveDestructuring,
  'vue-no-reactivity-after-await': vueNoReactivityAfterAwait,
  'vue-no-ref-access-in-templates': vueNoRefAccessInTemplates,
  'vue-no-resolve-component-in-composables': vueNoResolveComponentInComposables,
  'vue-no-torefs-on-props': vueNoTorefsOnProps,
  'vue-no-unresolvable-define-emits': vueNoUnresolvableDefineEmits,
  'vue-prefer-define-emits-object-syntax': vuePreferDefineEmitsObjectSyntax,
  'vue-prefer-theme-tokens': vuePreferThemeTokens,
  'vue-require-composable-prefix': vueRequireComposablePrefix,
  'vue-valid-tailwind-classes': vueValidTailwindClasses,
})

const plugin: ESLint.Plugin = {
  meta: {
    name: 'harlanzw',
    version,
  },
  languages: {
    prompt: new PromptLanguage() as any,
  },
  rules: rules as ESLint.Plugin['rules'],
  configs: {} as Record<string, Linter.Config[]>,
}

// Prompt config: recommended
const promptRecommendedRules: Record<string, Linter.RuleSeverity> = {
  'harlanzw/prompt-weak-instruction': 'warn',
  'harlanzw/prompt-instruction-dilution': 'warn',
  'harlanzw/prompt-ambiguous-quantifier': 'warn',
  'harlanzw/prompt-vague-term': 'warn',
  'harlanzw/prompt-unresolved-reference': 'warn',
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
  'harlanzw/ai-deslop-false-dichotomy': 'warn',
  'harlanzw/ai-deslop-false-sincerity': 'error',
  'harlanzw/ai-deslop-filler': 'error',
  'harlanzw/ai-deslop-adverbs': 'error',
  'harlanzw/ai-deslop-hedging': 'warn',
  'harlanzw/ai-deslop-no-em-dash': 'error',
  'harlanzw/ai-deslop-no-exclamation': 'warn',
  'harlanzw/ai-deslop-passive-voice': 'warn',
  'harlanzw/ai-deslop-weak-opener': 'warn',
  'harlanzw/ai-deslop-autolink': 'warn',
  'harlanzw/ai-deslop-frontmatter-spacing': 'error',
}

// Rules that use Nuxt Content syntax ({lang="..."}, vue script tags in code blocks)
const nuxtContentDeslopRules: Record<string, Linter.RuleSeverity> = {
  'harlanzw/ai-deslop-code-lang': 'warn',
  'harlanzw/ai-deslop-vue-ts-lang': 'error',
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
  {
    name: 'harlanzw/content/nuxt-content',
    files: NUXT_CONTENT_FILES,
    ignores: CODE_IGNORES,
    language: 'harlanzw/prompt',
    plugins: { harlanzw: plugin },
    rules: nuxtContentDeslopRules,
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
const NUXT_VUE_FILES = [
  '**/*.vue',
  '**/*.js',
  '**/*.jsx',
  '**/*.mjs',
  '**/*.cjs',
  '**/*.ts',
  '**/*.tsx',
  '**/*.mts',
  '**/*.cts',
]
plugin.configs!.nuxt = [
  {
    name: 'harlanzw/nuxt',
    files: NUXT_VUE_FILES,
    ignores: CODE_IGNORES,
    plugins: { harlanzw: plugin },
    rules: {
      'harlanzw/nuxt-await-navigate-to': 'error',
      'harlanzw/nuxt-no-random': 'error',
      'harlanzw/nuxt-no-redundant-component-imports': 'warn',
      'harlanzw/nuxt-no-redundant-import-meta': 'error',
      'harlanzw/nuxt-no-self-layer-alias': 'warn',
      'harlanzw/nuxt-no-side-effects-in-async-data-handler': 'error',
      'harlanzw/nuxt-no-side-effects-in-setup': 'error',
      'harlanzw/nuxt-no-unsafe-date': 'warn',
      'harlanzw/nuxt-prefer-layer-alias': 'warn',
      'harlanzw/nuxt-prefer-navigate-to-over-router-push-replace': 'warn',
      'harlanzw/nuxt-prefer-nuxt-link-over-router-link': 'warn',
      'harlanzw/nuxt-ui-prefer-shorthand-css': 'warn',
      'harlanzw/no-silent-catch': 'error',
      'harlanzw/prefer-satisfies': 'warn',
    },
  },
]

// Opt-in design checks. The host Nuxt config supplies vue-eslint-parser.
function nuxtUiConfig(options: NuxtUiDesignOptions = {}): Linter.Config[] {
  return [{
    name: 'harlanzw/nuxt-ui',
    files: ['**/*.vue'],
    ignores: CODE_IGNORES,
    plugins: { harlanzw: plugin },
    rules: {
      'harlanzw/nuxt-ui-no-restyle': ['warn', options],
      'harlanzw/vue-no-dynamic-tailwind-classes': 'error',
    },
  }]
}

plugin.configs!.nuxtUi = nuxtUiConfig()

// Vue config
plugin.configs!.vue = [
  {
    name: 'harlanzw/vue',
    files: NUXT_VUE_FILES,
    ignores: CODE_IGNORES,
    plugins: { harlanzw: plugin },
    rules: {
      'harlanzw/vue-no-async-lifecycle-hook': 'error',
      'harlanzw/vue-no-faux-composables': 'error',
      'harlanzw/vue-no-nested-reactivity': 'error',
      'harlanzw/vue-no-passing-refs-as-props': 'error',
      'harlanzw/vue-no-reactive-destructuring': 'error',
      'harlanzw/vue-no-reactivity-after-await': 'error',
      'harlanzw/vue-no-ref-access-in-templates': 'warn',
      'harlanzw/vue-no-resolve-component-in-composables': 'error',
      'harlanzw/vue-no-torefs-on-props': 'warn',
      'harlanzw/vue-no-unresolvable-define-emits': 'error',
      'harlanzw/vue-prefer-define-emits-object-syntax': 'warn',
      'harlanzw/vue-require-composable-prefix': 'warn',
      'harlanzw/no-silent-catch': 'error',
      'harlanzw/prefer-satisfies': 'warn',
    },
  },
  {
    // SFCs with two <script> blocks (one for exported types, one for setup)
    // confuse `import/first`: it concatenates the blocks and reports the
    // setup-block imports as "below the body of the module" because the
    // first block has exports. Autofix then corrupts the file by hoisting
    // imports above the exports. Disable on .vue files where the rule has
    // no useful signal anyway.
    name: 'harlanzw/vue/import-first-off',
    files: ['**/*.vue'],
    ignores: CODE_IGNORES,
    rules: {
      'import/first': 'off',
    },
  },
]

// pnpm config
plugin.configs!.pnpm = [
  {
    name: 'harlanzw/pnpm',
    files: ['pnpm-workspace.yaml'],
    plugins: { harlanzw: plugin },
    rules: {
      'harlanzw/pnpm-require-trust-policy': 'error',
    },
  },
]

// Test config
plugin.configs!.tests = [
  {
    name: 'harlanzw/tests',
    files: TEST_FILES,
    ignores: CODE_IGNORES,
    plugins: { harlanzw: plugin },
    rules: {
      'harlanzw/no-test-file-reads': 'warn',
    },
  },
]

// Docs config: the root-docs contract. Structure, not wording; the content and
// prompt configs already own wording. Opt in per repository, because the root
// allowlist and the docs/ lifecycle are a convention, not a fact about Markdown.
plugin.configs!.docs = [
  {
    name: 'harlanzw/docs/root',
    files: DOCS_ROOT_FILES,
    language: 'harlanzw/prompt',
    plugins: { harlanzw: plugin },
    rules: {
      'harlanzw/docs-root-allowlist': 'error',
      'harlanzw/docs-retired-pointer': 'error',
      'harlanzw/prompt-dangling-path': 'warn',
    },
  },
  {
    name: 'harlanzw/docs/tree',
    files: DOCS_TREE_FILES,
    language: 'harlanzw/prompt',
    plugins: { harlanzw: plugin },
    rules: {
      'harlanzw/docs-work-brief-contract': 'error',
      'harlanzw/docs-reference-no-status': 'error',
      'harlanzw/docs-retired-pointer': 'error',
    },
  },
]

// Recommended config
plugin.configs!.recommended = [
  ...plugin.configs!.link,
  ...plugin.configs!.nuxt,
  ...plugin.configs!.vue,
  ...plugin.configs!.tests,
]

// Factory options
export interface HarlanzwOptions {
  /**
   * Shared override blocks: ignores, node globals, test and markdown relaxations.
   *
   * Opt in with `true` for the defaults, or pass {@link BaseOptions}.
   *
   * @default false
   */
  base?: boolean | BaseOptions
  link?: boolean | LinkRuleOptions & { requireTrailingSlash?: boolean }
  /** Auto-enabled when the current package declares @nuxt/ui. False disables detection. */
  nuxtUi?: boolean | NuxtUiDesignOptions
  nuxt?: boolean
  vue?: boolean
  prompt?: boolean | 'recommended' | 'strict' | 'skill'
  content?: boolean
  pnpm?: boolean
  /** Enable rules scoped to test files. Nuxt and Vue presets enable them by default. */
  tests?: boolean
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
 * import { harlanzw } from 'eslint-plugin-harlanzw'
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
  const enablePrompt = options.prompt ?? detected.prompt

  if (options.base) {
    const baseOpts = typeof options.base === 'object' ? options.base : {}
    configs.push(...base({
      // A global ignore beats the prompt configs' `files`, so agent files stay
      // in the lint run whenever the prompt rules are there to lint them.
      agentFiles: enablePrompt ? 'lint' : 'ignore',
      ...baseOpts,
    }))
  }

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

  if (enablePrompt) {
    const preset = typeof options.prompt === 'string' ? options.prompt : 'recommended'
    configs.push(...plugin.configs![`prompt:${preset}`] as Linter.Config[])
  }

  const enableNuxt = options.nuxt ?? detected.nuxt
  if (enableNuxt) {
    configs.push(...plugin.configs!.nuxt as Linter.Config[])
  }

  if (options.nuxtUi ?? detected.nuxtUi)
    configs.push(...nuxtUiConfig(typeof options.nuxtUi === 'object' ? options.nuxtUi : {}))

  const enableVue = options.vue ?? detected.vue
  if (enableVue) {
    configs.push(...plugin.configs!.vue as Linter.Config[])
  }

  const enableTests = options.tests ?? (enableNuxt || enableVue)
  if (enableTests) {
    configs.push(...plugin.configs!.tests as Linter.Config[])
  }

  const enableContent = options.content ?? detected.content
  if (enableContent) {
    configs.push(...plugin.configs!.content as Linter.Config[])
  }

  const enablePnpm = options.pnpm ?? detected.pnpm
  if (enablePnpm) {
    configs.push(...plugin.configs!.pnpm as Linter.Config[])
  }

  configs.push(...extraConfigs)

  return configs
}

function detectFramework(): { nuxt: boolean, nuxtUi: boolean, vue: boolean, prompt: boolean, content: boolean, pnpm: boolean } {
  const cwd = process.cwd()
  let nuxt = existsSync(resolve(cwd, 'nuxt.config.ts')) || existsSync(resolve(cwd, 'nuxt.config.js'))
  let vue = nuxt
  let nuxtUi = false
  const packagePath = resolve(cwd, 'package.json')
  if (existsSync(packagePath)) {
    const pkg = JSON.parse(readFileSync(packagePath, 'utf-8'))
    const deps = { ...pkg.dependencies, ...pkg.devDependencies }
    nuxt = nuxt || !!deps.nuxt
    const installedUi = resolve(cwd, 'node_modules/@nuxt/ui/package.json')
    const uiVersion = existsSync(installedUi) ? JSON.parse(readFileSync(installedUi, 'utf8')).version : deps['@nuxt/ui']
    const uiMajor = typeof uiVersion === 'string' ? /^[~^]?(\d+)\./.exec(uiVersion)?.[1] : undefined
    nuxtUi = !!deps['@nuxt/ui'] && (!uiMajor || Number(uiMajor) >= 4)
    vue = vue || !!(deps.vue || deps.nuxt || nuxtUi)
  }
  const prompt = PROMPT_MARKERS.some(m => existsSync(resolve(cwd, m)))
  const content = existsSync(resolve(cwd, 'content')) || existsSync(resolve(cwd, 'docs'))
  const pnpm = existsSync(resolve(cwd, 'pnpm-workspace.yaml'))
  return { nuxt, nuxtUi, vue, prompt, content, pnpm }
}

interface HarlanzwFactory {
  (options?: HarlanzwOptions, ...extraConfigs: Linter.Config[]): Linter.Config[]
  detectFramework: typeof detectFramework
  plugin: ESLint.Plugin
}

const harlanzwWithPlugin: HarlanzwFactory = Object.assign(harlanzw, { plugin, detectFramework })

export type { BaseOptions } from './base'
export { base } from './base'
export type { ComponentStyleOptions, NuxtUiDesignOptions } from './rules/nuxt-ui-no-restyle'
export { harlanzwWithPlugin as harlanzw, plugin }
export default harlanzwWithPlugin

type RuleDefinitions = typeof rules

export type RuleOptions = {
  [K in keyof RuleDefinitions]: K extends 'link-trailing-slash'
    ? [LinkRuleOptions & { requireTrailingSlash?: boolean }]
    : K extends 'vue-prefer-theme-tokens'
      ? [ThemeTokenOptions?]
      : K extends 'vue-valid-tailwind-classes'
        ? [ValidClassOptions?]
        : K extends 'nuxt-ui-no-restyle'
          ? [NuxtUiDesignOptions?]
          : K extends typeof LINK_RULES_WITH_OPTIONS[number]
            ? [LinkRuleOptions]
            : []
}

export type Rules = {
  [K in keyof RuleOptions]: Linter.RuleEntry<RuleOptions[K]>
}
