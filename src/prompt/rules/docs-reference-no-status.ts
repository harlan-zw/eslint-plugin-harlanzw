import { getCodeBlockLines } from '../utils'

// Location is status: a document's folder says where it sits in its lifecycle.
// So a reference document is present tense and carries no status of its own;
// status lives on a brief in docs/work/.
const DEFAULT_DIRS = ['docs/arch', 'docs/postmortems', 'docs/repros', 'docs/runbooks']

const STATUS_LINE = /^\s{0,3}>?\s{0,3}(?:\*\*)?Status(?:\*\*)?\s*[:=]/i

function inReferenceDir(filename: string, dirs: string[]): boolean {
  // Leading slash so one `includes` covers an absolute and a relative path.
  const normalised = `/${filename.replaceAll('\\', '/').replace(/^\/+/, '')}`
  return dirs.some(dir => normalised.includes(`/${dir.replace(/^\/+|\/+$/g, '')}/`))
}

export default {
  meta: {
    type: 'problem' as const,
    docs: { description: 'Forbid a Status line in a reference document, where location already carries status' },
    schema: [{
      type: 'object' as const,
      properties: {
        dirs: { type: 'array' as const, items: { type: 'string' as const } },
      },
      additionalProperties: false,
    }],
    messages: {
      status: 'A reference document is present tense and carries no `Status:` line. Status belongs on a brief in `docs/work/`, where moving the file is the state change.',
    },
  },
  create(context: any) {
    const dirs: string[] = context.options?.[0]?.dirs ?? DEFAULT_DIRS
    if (!inReferenceDir(context.filename ?? '', dirs))
      return {}

    return {
      document() {
        const lines: string[] = context.sourceCode.lines
        const codeBlockLines = getCodeBlockLines(lines)

        for (let i = 0; i < lines.length; i++) {
          if (codeBlockLines.has(i))
            continue
          if (!STATUS_LINE.test(lines[i]))
            continue
          context.report({
            loc: {
              start: { line: i + 1, column: 1 },
              end: { line: i + 1, column: lines[i].length + 1 },
            },
            messageId: 'status',
          })
        }
      },
    }
  },
}
