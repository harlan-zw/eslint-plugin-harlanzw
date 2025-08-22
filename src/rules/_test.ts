import type { RuleTesterInitOptions, TestCasesOptions } from 'eslint-vitest-rule-tester'
import tsParser from '@typescript-eslint/parser'
import { run as _run } from 'eslint-vitest-rule-tester'
import vueParser from 'vue-eslint-parser'

export function run(options: TestCasesOptions & RuleTesterInitOptions): void {
  _run({
    parser: tsParser as any,
    ...options,
  })
}

export function runVue(options: TestCasesOptions & RuleTesterInitOptions): void {
  _run({
    parser: vueParser as any,
    parserOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    ...options,
  })
}
