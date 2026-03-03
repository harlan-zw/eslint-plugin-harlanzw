import type { DocumentNode } from '../types'
import { CHARS_PER_TOKEN } from '../constants'

export default {
  meta: {
    type: 'suggestion' as const,
    docs: { description: 'Warn when prompt exceeds a token estimate threshold' },
    schema: [
      {
        type: 'object',
        properties: {
          maxTokens: { type: 'number', minimum: 1 },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      large: 'Prompt uses ~{{tokens}} tokens. Large prompts leave less room for the model\'s response.',
    },
  },
  create(context: any) {
    const maxTokens = context.options[0]?.maxTokens ?? 2000

    return {
      document(node: DocumentNode) {
        const sourceCode = context.sourceCode
        const estimatedTokens = Math.ceil(sourceCode.text.length / CHARS_PER_TOKEN)

        if (estimatedTokens > maxTokens) {
          context.report({
            node,
            messageId: 'large',
            data: { tokens: String(estimatedTokens) },
          })
        }
      },
    }
  },
}
