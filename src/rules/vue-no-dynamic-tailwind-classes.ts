import type { TSESTree } from '@typescript-eslint/utils'
import type { ClassAttribute } from '../design-classes'
import type { TailwindContext } from '../tailwind-context'
import { attributeClasses, baseUtility, createClassBindings } from '../design-classes'
import { componentClasses } from '../tailwind-context'
import { createEslintRule } from '../utils'
import { defineTemplateBodyVisitor } from '../vue-utils'

export const RULE_NAME = 'vue-no-dynamic-tailwind-classes'
export type Options = []
export type MessageIds = 'partialClass'

// Preserve expression boundaries. A placeholder cannot be mistaken for a complete utility.
function fragments(node: TSESTree.Node): string {
  if (node.type === 'Literal' && typeof node.value === 'string')
    return node.value
  if (node.type === 'TemplateLiteral')
    return node.quasis.map(quasi => quasi.value.cooked ?? quasi.value.raw).join('\0')
  if (node.type === 'BinaryExpression' && node.operator === '+')
    return `${fragments(node.left)}\0${fragments(node.right)}`
  return '\0'
}

function isTailwindConstruction(node: TSESTree.Node, classes: string[], theme?: TailwindContext): boolean {
  return fragments(node).split(/\s+/).some((token) => {
    if (!token.includes('\0') || token.replaceAll('\0', '') === '')
      return false
    const pattern = new RegExp(`^${token.split('\0').map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*')}$`)
    const prefix = baseUtility(token).split('\0')[0]
    const known = /^(?:p[xytrblse]?|m[xytrblse]?|gap|space|bg|text|border|ring|outline|shadow|rounded|font|tracking|leading|size|[whz]|min-[wh]|max-[wh]|flex|grid|col|row|items|justify|content|self|place|opacity|order|top|right|bottom|left|inset|translate|rotate|scale|duration|delay|ease|animate|from|via|to|fill|stroke|decoration|accent|caret)-/.test(prefix)
    if (known)
      return true
    if (classes.some(name => pattern.test(name) && (theme ? !theme.compile(name) : !known)))
      return false
    if (theme?.isUtility(`${prefix}0`))
      return true
    // Complete classes with a constructed variant or opacity modifier also escape source detection.
    if (/^[^\0]*:\0/.test(token) || /^\0+\//.test(token))
      return true
    return false
  })
}

export default createEslintRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'problem',
    docs: { description: 'Use complete Tailwind class names in Vue class and ui bindings' },
    schema: [],
    messages: { partialClass: 'This expression builds part of a class name. Choose complete classes, such as active ? "bg-primary" : "bg-muted".' },
  },
  defaultOptions: [],
  create(context) {
    const theme = context.settings['harlanzw/tailwind'] as TailwindContext | undefined
    const classes = [...(theme?.classes ?? []), ...componentClasses(context.sourceCode)]
    const bindings = createClassBindings(context.sourceCode)
    return defineTemplateBodyVisitor(context, {
      VAttribute(attribute: ClassAttribute) {
        for (const finding of attributeClasses(attribute, bindings.resolve(attribute))) {
          if (finding._tag === 'Partial' && isTailwindConstruction(finding.node, classes, theme))
            context.report({ node: finding.node, messageId: 'partialClass' })
        }
      },
    }, bindings.visitors)
  },
})
