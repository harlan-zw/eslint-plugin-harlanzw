import type { TSESTree } from '@typescript-eslint/utils'
import { createEslintRule } from '../utils'
import { defineTemplateBodyVisitor, isVueParser } from '../vue-utils'

export const RULE_NAME = 'vue-no-nested-reactivity'
export type MessageIds = 'noNestedInRef' | 'noNestedInReactive' | 'noNestedInShallowRef' | 'noNestedInShallowReactive' | 'noNestedInComputed' | 'noNestedInWatch' | 'noNestedInWatchEffect'
export type Options = []

export default createEslintRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'problem',
    docs: {
      description: 'disallow nested reactivity patterns like reactive({ foo: ref() }) or ref({ foo: reactive() })',
    },
    fixable: undefined,
    schema: [],
    messages: {
      noNestedInRef: 'Avoid nesting reactivity primitives inside ref().',
      noNestedInReactive: 'Avoid nesting reactivity primitives inside reactive().',
      noNestedInShallowRef: 'Avoid nesting reactivity primitives inside shallowRef().',
      noNestedInShallowReactive: 'Avoid nesting reactivity primitives inside shallowReactive().',
      noNestedInComputed: 'Avoid nesting reactivity primitives inside computed().',
      noNestedInWatch: 'Avoid nesting reactivity primitives inside watch().',
      noNestedInWatchEffect: 'Avoid nesting reactivity primitives inside watchEffect().',
    },
  },
  defaultOptions: [],
  create: (context) => {
    const reactiveAPIs = new Set(['ref', 'reactive', 'shallowRef', 'shallowReactive', 'computed', 'watch', 'watchEffect'])
    const vueImports = new Set<string>()
    const reactiveVariables = new Map<string, string>() // variable name -> reactive type

    function getMessageId(outerType: string): MessageIds {
      switch (outerType) {
        case 'ref': return 'noNestedInRef'
        case 'reactive': return 'noNestedInReactive'
        case 'shallowRef': return 'noNestedInShallowRef'
        case 'shallowReactive': return 'noNestedInShallowReactive'
        case 'computed': return 'noNestedInComputed'
        case 'watch': return 'noNestedInWatch'
        case 'watchEffect': return 'noNestedInWatchEffect'
        default: return 'noNestedInReactive' // fallback
      }
    }

    function isReactiveCall(node: TSESTree.Node): string | null {
      if (node.type === 'CallExpression' && node.callee.type === 'Identifier') {
        const name = node.callee.name
        if (reactiveAPIs.has(name) && vueImports.has(name)) {
          return name
        }
      }
      return null
    }

    function checkObjectExpressionForReactivity(obj: TSESTree.ObjectExpression, outerType: string): void {
      for (const prop of obj.properties) {
        if (prop.type === 'Property') {
          // Check direct reactive calls: { foo: ref() }
          if (prop.value.type === 'CallExpression') {
            const innerType = isReactiveCall(prop.value)
            if (innerType && innerType !== outerType) {
              context.report({
                node: prop.value,
                messageId: getMessageId(outerType),
              })
            }
          }
          // Check nested objects: { nested: { value: ref() } }
          else if (prop.value.type === 'ObjectExpression') {
            checkObjectExpressionForReactivity(prop.value, outerType)
          }
          // Check variable references
          else if (prop.value.type === 'Identifier') {
            const varType = reactiveVariables.get(prop.value.name)
            if (varType && varType !== outerType) {
              context.report({
                node: prop.value,
                messageId: getMessageId(outerType),
              })
            }
          }
          // Check shorthand properties: { foo } where foo is reactive
          else if (prop.shorthand && prop.key.type === 'Identifier') {
            const varType = reactiveVariables.get(prop.key.name)
            if (varType && varType !== outerType) {
              context.report({
                node: prop.key,
                messageId: getMessageId(outerType),
              })
            }
          }
        }
      }
    }

    function checkComputedCallback(node: TSESTree.CallExpression): void {
      if (node.callee.type === 'Identifier' && node.callee.name === 'computed' && vueImports.has('computed')) {
        // Check the callback function for reactive returns
        if (node.arguments.length > 0) {
          const callback = node.arguments[0]
          if (callback.type === 'ArrowFunctionExpression' || callback.type === 'FunctionExpression') {
            if (callback.body.type === 'BlockStatement') {
              // Check return statements in block
              for (const stmt of callback.body.body) {
                if (stmt.type === 'ReturnStatement' && stmt.argument) {
                  checkReturnForReactivity(stmt.argument)
                }
              }
            }
            else {
              // Arrow function with expression body
              checkReturnForReactivity(callback.body)
            }
          }
        }
      }
    }

    function checkReturnForReactivity(node: TSESTree.Expression): void {
      // Check direct reactive calls in return: computed(() => ref(0))
      if (node.type === 'CallExpression') {
        const reactiveType = isReactiveCall(node)
        if (reactiveType) {
          context.report({
            node,
            messageId: 'noNestedInComputed',
          })
        }
      }
      // Check variable references: computed(() => someRef)
      else if (node.type === 'Identifier') {
        const varType = reactiveVariables.get(node.name)
        if (varType) {
          context.report({
            node,
            messageId: 'noNestedInComputed',
          })
        }
      }
      // Check object expressions: computed(() => ({ foo: ref(0) }))
      else if (node.type === 'ObjectExpression') {
        for (const prop of node.properties) {
          if (prop.type === 'Property') {
            if (prop.value.type === 'CallExpression') {
              const reactiveType = isReactiveCall(prop.value)
              if (reactiveType) {
                context.report({
                  node: prop.value,
                  messageId: 'noNestedInComputed',
                })
              }
            }
            else if (prop.value.type === 'Identifier') {
              const varType = reactiveVariables.get(prop.value.name)
              if (varType) {
                context.report({
                  node: prop.value,
                  messageId: 'noNestedInComputed',
                })
              }
            }
          }
        }
      }
    }

    function checkForNestedReactivity(node: TSESTree.CallExpression, outerType: string): void {
      if (!node.arguments.length)
        return

      const arg = node.arguments[0]

      // Check object expressions recursively
      if (arg.type === 'ObjectExpression') {
        checkObjectExpressionForReactivity(arg, outerType)
      }

      // Check if passing a reactive variable directly: reactive(someRef)
      else if (arg.type === 'Identifier') {
        const varType = reactiveVariables.get(arg.name)
        if (varType && varType !== outerType) {
          context.report({
            node: arg,
            messageId: getMessageId(outerType),
          })
        }
      }
    }

    const scriptVisitor = {
      Program() {
        vueImports.clear()
        reactiveVariables.clear()
      },

      ImportDeclaration(node: any) {
        if (node.source.value === 'vue') {
          node.specifiers.forEach((spec: any) => {
            if (spec.type === 'ImportSpecifier') {
              const imported = spec.imported
              if (imported.type === 'Identifier') {
                vueImports.add(imported.name)
              }
            }
          })
        }
      },

      CallExpression(node: any) {
        const reactiveType = isReactiveCall(node)
        if (reactiveType) {
          checkForNestedReactivity(node, reactiveType)
        }

        // Also check computed callbacks for reactive returns
        checkComputedCallback(node)
      },

      VariableDeclarator(node: any) {
        if (node.id.type === 'Identifier' && node.init?.type === 'CallExpression') {
          const reactiveType = isReactiveCall(node.init)
          if (reactiveType) {
            reactiveVariables.set(node.id.name, reactiveType)
          }
        }
      },
    }

    const templateVisitor = {
      // Check for nested reactivity in Vue SFC templates
      CallExpression(node: any) {
        const reactiveType = isReactiveCall(node)
        if (reactiveType) {
          checkForNestedReactivity(node, reactiveType)
        }

        // Also check computed callbacks for reactive returns
        checkComputedCallback(node)
      },
    }

    // If this is a Vue SFC, use template body visitor
    if (isVueParser(context)) {
      return defineTemplateBodyVisitor(context, templateVisitor, scriptVisitor)
    }

    // For non-SFC files, use the script visitor only
    return scriptVisitor
  },
})
