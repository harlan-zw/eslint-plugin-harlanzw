import { existsSync } from 'node:fs'
import { isAbsolute, resolve } from 'node:path'
import { getCodeBlockLines, isInScope, parseLineScopes } from '../utils'

// A backticked repository path in an instruction file is a promise that the
// file is there. When it is not, the agent spends a turn discovering that.
const BACKTICKED = /`([^`\n]+)`/g

// Only a string that is unambiguously a repository path is checked. A command,
// a glob, a placeholder, a URL and a bare word are all legitimately backticked.
function looksLikeRepoPath(value: string): boolean {
  if (!value.includes('/'))
    return false
  if (value.length > 200)
    return false
  if (/[\s<>*?{}|$()[\]!]/.test(value))
    return false
  if (value.includes('://') || value.startsWith('//'))
    return false
  if (value.startsWith('~') || isAbsolute(value))
    return false
  if (value.startsWith('.') && !value.startsWith('./'))
    return false
  // `@scope/package` and `npm:thing/other` name packages, not paths.
  if (value.startsWith('@') || /^[a-z][a-z0-9+.-]*:/i.test(value))
    return false
  return true
}

// A citation often carries a position: `src/index.ts:42`, a `:42-50` range or
// a `README.md#L214` anchor. The suffix points into the file, so the check
// must resolve the path underneath it.
function stripPositionSuffix(value: string): string {
  return value
    .replace(/#.*$/, '')
    .replace(/(:\d+(?:-\d+)?)+$/, '')
}

export default {
  meta: {
    type: 'problem' as const,
    docs: { description: 'Flag a backticked repository path in an instruction file that does not exist' },
    schema: [{
      type: 'object' as const,
      properties: {
        root: { type: 'string' as const },
        ignore: { type: 'array' as const, items: { type: 'string' as const } },
      },
      additionalProperties: false,
    }],
    messages: {
      dangling: '`{{path}}` does not exist. An instruction file that names a missing path costs the next agent a turn to find that out.',
    },
  },
  create(context: any) {
    const options = context.options?.[0] ?? {}
    const root = resolve(options.root ?? context.cwd ?? process.cwd())
    const ignore: string[] = options.ignore ?? []

    return {
      document() {
        const lines: string[] = context.sourceCode.lines
        const codeBlockLines = getCodeBlockLines(lines)

        for (let i = 0; i < lines.length; i++) {
          if (codeBlockLines.has(i))
            continue
          const line = lines[i]
          const scopes = parseLineScopes(line)
          BACKTICKED.lastIndex = 0
          let match: RegExpExecArray | null
          while ((match = BACKTICKED.exec(line)) !== null) {
            const value = match[1].trim().replace(/[.,;:]$/, '')
            if (!looksLikeRepoPath(value) || ignore.includes(value))
              continue
            if (isInScope(scopes, match.index, match.index + match[0].length, ['link-url']))
              continue
            const candidate = stripPositionSuffix(value).replace(/\/$/, '')
            if (existsSync(resolve(root, candidate)))
              continue
            context.report({
              loc: {
                start: { line: i + 1, column: match.index + 1 },
                end: { line: i + 1, column: match.index + match[0].length + 1 },
              },
              messageId: 'dangling',
              data: { path: value },
            })
          }
        }
      },
    }
  },
}
