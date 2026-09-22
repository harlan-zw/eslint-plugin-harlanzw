import type { MarkdownScope } from '../utils'
import { getCodeBlockLines, parseLineScopes } from '../utils'

// A document renamed across every repository leaves pointers behind. This rule
// names the replacement rather than leaving the reader to guess.
const DEFAULT_RETIRED: Record<string, string> = {
  'CLAUDE.md': 'AGENTS.md',
  'CONTEXT.md': 'GLOSSARY.md or docs/arch/',
}

// An absolute or home-relative path is somebody else's file, not this
// repository's retired one. `~/.claude/CLAUDE.md` is genuinely named that and
// nothing renamed it.
const EXTERNAL = /(?:~|\/home\/[^/\s`]+|\/Users\/[^/\s`]+|\$HOME)\/[^\s`)]*/g

// A retired name inside a URL names a file on another site, not a pointer
// into this repository.
function insideUrl(line: string, start: number): boolean {
  for (let i = start - 1; i >= 0; i--) {
    if (/\s/.test(line[i]))
      return false
    if (line.slice(i, i + 3) === '://')
      return true
  }
  return false
}

// A scheme (https:, mailto:) or protocol-relative `//` makes a link URL
// remote. A relative link URL is still a pointer into this repository.
const REMOTE_URL = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i

function inRemoteUrl(line: string, scopes: MarkdownScope[], start: number, end: number): boolean {
  const url = scopes.find(s => s.type === 'link-url' && start >= s.start && end <= s.end)
  return url !== undefined && REMOTE_URL.test(line.slice(url.start, url.end))
}

export default {
  meta: {
    type: 'problem' as const,
    docs: { description: 'Flag a pointer to a document that has been retired, naming its replacement' },
    schema: [{
      type: 'object' as const,
      properties: {
        retired: { type: 'object' as const, additionalProperties: { type: 'string' as const } },
      },
      additionalProperties: false,
    }],
    messages: {
      retired: '`{{name}}` is retired. Point the reader at {{replacement}} instead.',
    },
  },
  create(context: any) {
    const retired: Record<string, string> = context.options?.[0]?.retired ?? DEFAULT_RETIRED
    const names = Object.keys(retired)
    if (!names.length)
      return {}

    return {
      document() {
        const lines: string[] = context.sourceCode.lines
        const codeBlockLines = getCodeBlockLines(lines)

        for (let i = 0; i < lines.length; i++) {
          if (codeBlockLines.has(i))
            continue
          const original = lines[i]
          const scopes = parseLineScopes(original)
          // Strip external paths first, so a line may cite the global file and
          // still be caught for a bare pointer elsewhere on it. Blank each one
          // out at its original width, so report columns stay on the original
          // line.
          const line = original.replace(EXTERNAL, match => ' '.repeat(match.length))
          for (const name of names) {
            const at = line.indexOf(name)
            if (at < 0)
              continue
            if (inRemoteUrl(original, scopes, at, at + name.length))
              continue
            if (insideUrl(original, at))
              continue
            context.report({
              loc: {
                start: { line: i + 1, column: at + 1 },
                end: { line: i + 1, column: at + name.length + 1 },
              },
              messageId: 'retired',
              data: { name, replacement: retired[name] },
            })
          }
        }
      },
    }
  },
}
