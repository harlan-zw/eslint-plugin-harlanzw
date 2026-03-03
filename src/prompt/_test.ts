import { RuleTester } from 'eslint'
import { plugin } from '../index'

export function createPromptRuleTester(): RuleTester {
  return new RuleTester({
    plugins: { harlanzw: plugin },
    language: 'harlanzw/prompt',
  })
}
