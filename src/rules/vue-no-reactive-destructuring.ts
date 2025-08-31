import { createEslintRule } from '../utils'

export default createEslintRule({
  name: 'vue-no-reactive-destructuring',
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow destructuring reactive objects as it loses reactivity',
    },
    fixable: 'code',
    schema: [],
    messages: {
      destructuringReactive: 'Destructuring a reactive object loses reactivity. Use toRefs() or access properties directly.',
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      VariableDeclarator(node) {
        // Check if it's destructuring assignment
        if (node.id.type !== 'ObjectPattern' && node.id.type !== 'ArrayPattern') {
          return
        }

        // Check if the init is a call to reactive()
        if (!node.init || node.init.type !== 'CallExpression') {
          return
        }

        const callee = node.init.callee
        if (callee.type === 'Identifier' && callee.name === 'reactive') {
          context.report({
            node: node.id,
            messageId: 'destructuringReactive',
            fix(fixer) {
              const sourceCode = context.getSourceCode()
              const destructuredPattern = sourceCode.getText(node.id)
              const reactiveCall = sourceCode.getText(node.init!)

              // Suggest using toRefs
              return fixer.replaceText(node, `${destructuredPattern} = toRefs(${reactiveCall})`)
            },
          })
        }
      },
    }
  },
})
