import { readFileSync } from 'node:fs'
import process from 'node:process'
import { Linter } from 'eslint'
import * as vueParser from 'vue-eslint-parser'
import * as tsParser from '@typescript-eslint/parser'
import rule from './src/rules/prefer-satisfies'
const linter = new Linter()
for (const file of process.argv.slice(2)) {
  const msgs = linter.verify(readFileSync(file, 'utf8'), [{
    files: ['**/*.vue'],
    languageOptions: { parser: vueParser as any, parserOptions: { parser: tsParser as any, ecmaVersion: 'latest', sourceType: 'module' } },
    plugins: { h: { rules: { s: rule as any } } },
    rules: { 'h/s': 'warn' },
  }], file)
  console.log(`${msgs.filter(m => m.ruleId === 'h/s').length}  ${file.split('/').slice(-1)[0]}`)
}
