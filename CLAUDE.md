# CLAUDE.md

`eslint-plugin-harlanzw`: experimental ESLint rules for Vue/Nuxt projects. Three families: link hygiene + Nuxt + Vue reactivity rules, AI-deslop rules for `content/**/*.md`, and prompt-linting rules. Rules may eventually be submitted upstream to the official Vue ESLint plugin.

```bash
pnpm dev        # stub build; pnpm lint needs this first
pnpm build      # unbuild, ESM + d.ts to dist/
pnpm test
pnpm typecheck
pnpm release
```

## Layout

- `src/index.ts` — plugin export, registers every rule
- `src/rules/` — one rule per file, plus `<rule>.test.ts` beside it and `<rule>.md` when the rule needs long docs
- `src/utils.ts` — `createEslintRule` (auto-generates the docs URL) and rule helpers
- `src/base.ts` — `base()`, the shared override blocks (ignores, node globals, test/markdown/example relaxations)
- `src/vue-utils.ts` — Vue AST helpers (`isVueParser`, `defineTemplateBodyVisitor`, `trackVueImports`, `trackNonVueImports`, `VUE_REACTIVITY_APIS`)
- `src/ast-utils.ts` — general AST helpers (calls, awaits, returns, scope)
- `playground/` — Nuxt 4 app for manual rule testing

Shared configs: `link`, `nuxt`, `vue`, `recommended` (those three), `content` (deslop), `prompt:recommended`, `prompt:strict`, `prompt:skill`. `base` is opt in and turns rules off rather than on.

`createReactivityChecker` returns `hasReactivityInStatement`/`hasReactivityInExpression` and is shared by the composable rules; reach for it rather than re-walking for reactivity calls.

## Every new rule needs

1. a `.test.ts` beside it, covering valid and invalid cases
2. an entry in the rules table in `README.md`

Tests run on Vitest (globals enabled) via `eslint-vitest-rule-tester`; shared helpers live in `src/rules/_test.ts`.

## Vue AST rules

`vue-eslint-parser` has behaviours that will silently produce a rule that never fires (lowercase element names, mandatory dual visitors, `filename: 'test.vue'` in tests). Read [docs/vue-ast-rules.md](docs/vue-ast-rules.md) before writing or debugging one.

## Build

unbuild. `@typescript-eslint/utils` stays external; `@antfu/utils` is inlined.
