import type { DocumentNode } from '../types'
import { getCodeBlockLines, getFrontmatterEnd, isInScope, isInsideCompoundIdentifier, parseLineScopes, shouldSkipLine } from '../utils'

// Common past participles for passive voice detection
// Kept conservative to reduce false positives
const PAST_PARTICIPLES = [
  'generated',
  'created',
  'configured',
  'handled',
  'managed',
  'processed',
  'rendered',
  'stored',
  'loaded',
  'displayed',
  'executed',
  'initialized',
  'validated',
  'called',
  'defined',
  'imported',
  'exported',
  'installed',
  'deployed',
  'compiled',
  'bundled',
  'built',
  'cached',
  'fetched',
  'parsed',
  'resolved',
  'transformed',
  'injected',
  'registered',
  'mounted',
  'triggered',
  'dispatched',
  'emitted',
  'thrown',
  'caught',
  'logged',
  'sent',
  'received',
  'updated',
  'deleted',
  'removed',
  'added',
  'applied',
  'enabled',
  'disabled',
  'required',
  'expected',
  'used',
  'needed',
  'provided',
  'supported',
  'determined',
  'calculated',
  'computed',
  'evaluated',
  'performed',
  'achieved',
  'accomplished',
  'completed',
  'finished',
  'started',
  'stopped',
  'paused',
  'resumed',
  'found',
  'detected',
  'discovered',
  'identified',
  'selected',
  'chosen',
  'assigned',
  'allocated',
  'released',
  'published',
  'shared',
  'distributed',
  'transmitted',
  'converted',
  'formatted',
  'serialized',
  'deserialized',
  'encoded',
  'decoded',
  'encrypted',
  'decrypted',
  'compressed',
  'extracted',
  'filtered',
  'sorted',
  'grouped',
  'merged',
  'split',
  'combined',
  'concatenated',
  'joined',
  'wrapped',
  'unwrapped',
  'mapped',
  'reduced',
  'iterated',
  'traversed',
  'visited',
  'invoked',
  'measured',
  'tracked',
  'monitored',
  'observed',
  'watched',
]

const PARTICIPLES_PATTERN = PAST_PARTICIPLES.join('|')
// Match: is/are/was/were/be/been/being + optional adverb + past participle
const PASSIVE_REGEX = new RegExp(
  `\\b(?:is|are|was|were|be|been|being)\\s+(?:\\w+ly\\s+)?(?:${PARTICIPLES_PATTERN})\\b`,
  'gi',
)

export default {
  meta: {
    type: 'suggestion' as const,
    docs: { description: 'Flag passive voice constructions in content' },
    schema: [],
    messages: {
      passive: 'Passive voice: "{{found}}". Consider rewriting in active voice.',
    },
  },
  create(context: any) {
    return {
      document(_node: DocumentNode) {
        const sourceCode = context.sourceCode
        const lines: string[] = sourceCode.lines
        const codeBlockLines = getCodeBlockLines(lines)
        const frontmatterEnd = getFrontmatterEnd(lines)

        for (let i = 0; i < lines.length; i++) {
          if (shouldSkipLine(i, codeBlockLines, frontmatterEnd))
            continue

          const line = lines[i]
          const scopes = parseLineScopes(line)
          // Reset regex state
          PASSIVE_REGEX.lastIndex = 0
          let match: RegExpExecArray | null
          while ((match = PASSIVE_REGEX.exec(line)) !== null) {
            if (isInsideCompoundIdentifier(line, match.index, match.index + match[0].length))
              continue
            if (isInScope(scopes, match.index, match.index + match[0].length, ['code', 'link-url']))
              continue
            context.report({
              loc: {
                start: { line: i + 1, column: match.index + 1 },
                end: { line: i + 1, column: match.index + match[0].length + 1 },
              },
              messageId: 'passive',
              data: { found: match[0] },
            })
          }
        }
      },
    }
  },
}
