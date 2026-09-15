import type { ClassAttribute } from '../design-classes'
import { attributeClasses, createClassBindings } from '../design-classes'
import { createEslintRule } from '../utils'
import { defineTemplateBodyVisitor } from '../vue-utils'

export const RULE_NAME = 'vue-no-dynamic-tailwind-classes'
export type Options = []
export type MessageIds = 'partialClass'

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
    const bindings = createClassBindings(context.sourceCode)
    return defineTemplateBodyVisitor(context, {
      VAttribute(attribute: ClassAttribute) {
        for (const finding of attributeClasses(attribute, bindings.resolve(attribute))) {
          if (finding._tag === 'Partial')
            context.report({ node: finding.node, messageId: 'partialClass' })
        }
      },
    }, bindings.visitors)
  },
})
