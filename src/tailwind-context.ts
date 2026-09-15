import postcss from 'postcss'
import selectorParser from 'postcss-selector-parser'

export interface TailwindContext {
  stylesheet: string
  fingerprint: string
  classes: string[]
  isUtility: (candidate: string) => boolean
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
