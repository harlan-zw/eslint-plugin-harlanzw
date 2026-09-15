import type { TSESLint } from '@typescript-eslint/utils'
import postcss from 'postcss'
import selectorParser from 'postcss-selector-parser'

export interface TailwindContext {
  stylesheet: string
  fingerprint: string
  classes: string[]
  isUtility: (candidate: string) => boolean
  canonicalize: (candidate: string) => string
  compile: (candidate: string) => string | null
}

export function cssClasses(css: string): string[] {
  const classes = new Set<string>()
  postcss.parse(css).walkRules((rule) => {
    selectorParser((selectors) => {
      selectors.walkClasses((node) => {
        classes.add(node.value)
      })
    }).processSync(rule.selector)
  })
  return [...classes]
}

export function tailwindContext(settings: Record<string, unknown>): TailwindContext {
  const value = settings['harlanzw/tailwind'] as TailwindContext | undefined
  if (!value || typeof value.compile !== 'function' || typeof value.isUtility !== 'function' || !Array.isArray(value.classes))
    throw new Error('Load the stylesheet with await tailwind({ stylesheet }) before enabling theme rules.')
  return value
}

/** Read style elements through Vue's parser, without matching script strings. */
export function componentClasses(sourceCode: TSESLint.SourceCode): string[] {
  const services = sourceCode.parserServices as { getDocumentFragment?: () => { children: { type: string, name?: string, startTag?: { range: number[], attributes: { directive: boolean, key: { name: string }, value?: { value: string } }[] }, endTag?: { range: number[] } }[] } }
  return (services.getDocumentFragment?.().children ?? []).flatMap(element =>
    element.type === 'VElement' && element.name === 'style' && element.startTag && element.endTag
    && !element.startTag.attributes.some(attribute => !attribute.directive && attribute.key.name === 'lang' && !['css', 'postcss'].includes(attribute.value?.value ?? 'css'))
      ? cssClasses(sourceCode.text.slice(element.startTag.range[1], element.endTag.range[0]))
      : [])
}
