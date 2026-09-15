import type { ClassAttribute } from '../design-classes'
import { attributeClasses, baseUtility, createClassBindings, matchesUtility } from '../design-classes'
import { tailwindContext } from '../tailwind-context'
import { createEslintRule } from '../utils'
import { defineTemplateBodyVisitor } from '../vue-utils'

export interface ThemeTokenOptions {
  /** Approved color suffixes, such as primary, muted, or brand-*. */
  colors?: string[]
  /** Approved spacing suffixes. Omit to use the stylesheet scale. */
  spacing?: string[]
  /** Also reject arbitrary values without a known token equivalent. */
  arbitraryValues?: boolean
  allow?: string[]
}

export default createEslintRule<[ThemeTokenOptions?], 'token'>({
  name: 'vue-prefer-theme-tokens',
  meta: {
    type: 'suggestion',
    docs: { description: 'Prefer theme colors and spacing over hard-coded values' },
    schema: [{ type: 'object', additionalProperties: false, properties: { arbitraryValues: { type: 'boolean' }, ...Object.fromEntries(['colors', 'spacing', 'allow'].map(name => [name, { type: 'array', items: { type: 'string' } }])) } }],
    messages: { token: '"{{className}}" bypasses the {{kind}} policy. Use {{choices}} from {{stylesheet}}, or define a shared token.' },
  },
  defaultOptions: [{}],
  create(context, [options = {}]) {
    const theme = tailwindContext(context.settings)
    const bindings = createClassBindings(context.sourceCode)
    return defineTemplateBodyVisitor(context, {
      VAttribute(attribute: ClassAttribute) {
        for (const finding of attributeClasses(attribute, bindings.resolve(attribute))) {
          if (finding._tag !== 'Static')
            continue
          for (const className of finding.value.split(/\s+/).filter(Boolean)) {
            const utility = baseUtility(className)
            if (options.allow?.some(pattern => matchesUtility(utility, pattern)))
              continue
            const css = theme.compile(className)
            if (!css)
              continue
            const spacing = /^(?:p[xytrblse]?|m[xytrblse]?|gap(?:-[xy])?|space-[xy])-(.+)$/.exec(utility)
              ?? /^\[(?:padding|margin|gap|column-gap|row-gap)(?:-[a-z]+)?:([\s\S]+)\]$/.exec(utility)
            const color = /^(?:bg|text|border(?:-[xytrblse])?|ring(?:-offset)?|outline|fill|stroke|decoration|accent|caret|from|via|to|shadow)-(.+)$/.exec(utility)
              ?? /^\[(?:color|background-color|border-color|outline-color|fill|stroke):([\s\S]+)\]$/.exec(utility)
            // A text utility may set font size. Inspect generated declarations before calling it a color.
            const isColor = color && /(?:^|[;{\n])\s*(?:color|background-color|border(?:-[a-z]+)?-color|outline-color|fill|stroke|text-decoration-color|accent-color|caret-color|--tw-(?:ring(?:-offset)?-color|shadow-color|gradient-(?:from|via|to)))\s*:/.test(css)
            const match = spacing ?? (isColor ? color : null)
            if (!match)
              continue
            const value = utility.startsWith('[') ? `[${match[1]}]` : match[1].split('/')[0]
            const kind = spacing ? 'spacing' : 'color'
            const approved = spacing ? options.spacing : options.colors
            const variable = /^(?:\(--|\[(?:[a-z-]+:)?(?:var\(|--))/.test(value) || /(?:var|env)\(/.test(value)
            const structural = /^(?:auto|px|inherit|current|transparent|none)$/.test(value.replace(/^\[|\]$/g, ''))
            const arbitrary = value.startsWith('[') && !variable
            if (variable || structural)
              continue
            const equivalent = arbitrary ? theme.canonicalize(className) : className
            const namedEquivalent = equivalent !== className && !baseUtility(equivalent).includes('[')
            const violatesPolicy = approved && !approved.some(pattern => matchesUtility(value, pattern))
            if (!violatesPolicy && !(arbitrary && options.arbitraryValues) && !namedEquivalent)
              continue
            context.report({ node: finding.node, messageId: 'token', data: { className, kind, choices: approved?.length ? approved.join(', ') : namedEquivalent ? equivalent : `a theme ${kind} token`, stylesheet: theme.stylesheet } })
          }
        }
      },
    }, bindings.visitors)
  },
})
