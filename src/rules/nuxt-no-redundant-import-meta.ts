import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import { createEslintRule } from '../utils'

export const RULE_NAME = 'nuxt-no-redundant-import-meta'
export type MessageIds = 'redundantImportMeta'
export type Options = []

export default createEslintRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'problem',
    docs: {
      description: 'disallow redundant import.meta.server or import.meta.client checks in scoped components',
    },
    schema: [],
    messages: {
      redundantImportMeta: 'This component is already scoped for {{scope}} rendering, granular checks are redundant.',
    },
  },
  defaultOptions: [],
  create: (context) => {
    const filename = context.getFilename()

    // Check if the file is a scoped Nuxt component
    const isServerComponent = filename.endsWith('.server.vue') || filename.endsWith('.server.js') || filename.endsWith('.server.ts')
    const isClientComponent = filename.endsWith('.client.vue') || filename.endsWith('.client.js') || filename.endsWith('.client.ts')

    if (!isServerComponent && !isClientComponent) {
      return {}
    }

    const scope = isServerComponent ? 'server-only' : 'client-only'

    return {
      MemberExpression(node) {
        // Check for import.meta.server or import.meta.client
        if (
          node.object.type === AST_NODE_TYPES.MetaProperty
          && node.object.meta.type === AST_NODE_TYPES.Identifier
          && node.object.meta.name === 'import'
          && node.object.property.type === AST_NODE_TYPES.Identifier
          && node.object.property.name === 'meta'
          && node.property.type === AST_NODE_TYPES.Identifier
          && (node.property.name === 'server' || node.property.name === 'client')
        ) {
          const accessType = node.property.name

          // Report if accessing server in .server component or client in .client component
          if ((isServerComponent && accessType === 'server') || (isClientComponent && accessType === 'client')) {
            context.report({
              node,
              messageId: 'redundantImportMeta',
              data: { scope },
            })
          }
        }
      },
    }
  },
})
