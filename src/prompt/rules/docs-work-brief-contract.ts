import { basename } from 'node:path'
import { getCodeBlockLines, getFrontmatterEnd } from '../utils'

// A brief lives in docs/work/ and tracks one open initiative. README.md is the
// index, shipped/ is closed work, and a leading underscore marks a template.
function isOpenBrief(filename: string, dir: string): boolean {
  // Leading slash so one `includes` covers an absolute and a relative path.
  const normalised = `/${filename.replaceAll('\\', '/').replace(/^\/+/, '')}`
  const workDir = `/${dir.replace(/^\/+|\/+$/g, '')}/`
  if (!normalised.includes(workDir))
    return false
  if (normalised.includes(`${workDir}shipped/`))
    return false
  const name = basename(normalised)
  return name.endsWith('.md') && name !== 'README.md' && !name.startsWith('_')
}

// Everything below is this contract's opinion, so everything below is an
// option. The defaults are Harlan's; "Harlan" as a bucket name is the clearest
// sign that a repository adopting this rule should set its own.
const DEFAULT_BUCKETS = ['Harlan', 'Blocked', 'Ready']
const DEFAULT_FIELDS = ['title', 'status', 'nextMove', 'doneMeans', 'ledger', 'log'] as const
type Field = typeof DEFAULT_FIELDS[number]

const H1 = /^#\s+\S/
const STATUS = /^Status:\s*\S/i
const NEXT_MOVE_LOOSE = /^\*\*Next move:\*\*/i
const DONE_MEANS = /^Done means:\s*\S/i
const LEDGER = /^##\s+Ledger\s*$/i
const LOG = /^##\s+Log\s*$/i
const LOG_ENTRY = /^\s*[-*]\s+\d{4}-\d{2}-\d{2}\b/

function bucketPattern(buckets: string[]): RegExp {
  const alternation = buckets.map(b => b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')
  return new RegExp(`^\\*\\*Next move:\\*\\*\\s*(?:${alternation})\\b`, 'i')
}

export default {
  meta: {
    type: 'problem' as const,
    docs: { description: 'Require every open brief in docs/work to carry the fields that make it auditable' },
    schema: [{
      type: 'object' as const,
      properties: {
        dir: { type: 'string' as const },
        buckets: { type: 'array' as const, items: { type: 'string' as const } },
        require: { type: 'array' as const, items: { enum: [...DEFAULT_FIELDS] } },
      },
      additionalProperties: false,
    }],
    messages: {
      missingTitle: 'A brief opens with an H1 title.',
      missingStatus: 'A brief carries a `Status:` line with the date, and the branch or pull request if one exists.',
      missingNextMove: 'A brief carries a `**Next move:**` line. Without it a reader cannot tell who is blocked.',
      badNextMove: 'A `**Next move:**` line starts with one bucket: {{buckets}}.',
      missingDoneMeans: 'A brief carries a `Done means:` line stating one checkable end state. Closure is unauditable without it.',
      missingLedger: 'A brief carries a `## Ledger` section listing the work as checkboxes.',
      missingLog: 'A brief carries a `## Log` section. Append progress there, never to a separate file.',
      undatedLog: 'A `## Log` holds dated entries, so `- YYYY-MM-DD …`. An undated entry cannot be read as history.',
    },
  },
  create(context: any) {
    const options = context.options?.[0] ?? {}
    const dir: string = options.dir ?? 'docs/work'
    const buckets: string[] = options.buckets ?? DEFAULT_BUCKETS
    const required = new Set<Field>(options.require ?? DEFAULT_FIELDS)
    const NEXT_MOVE = bucketPattern(buckets)

    if (!isOpenBrief(context.filename ?? '', dir))
      return {}

    return {
      document() {
        const lines: string[] = context.sourceCode.lines
        const codeBlockLines = getCodeBlockLines(lines)
        const frontmatterEnd = getFrontmatterEnd(lines)

        const found = {
          title: -1,
          status: -1,
          nextMove: -1,
          nextMoveLoose: -1,
          doneMeans: -1,
          ledger: -1,
          log: -1,
        }
        let datedLogEntry = false

        for (let i = frontmatterEnd; i < lines.length; i++) {
          if (codeBlockLines.has(i))
            continue
          const line = lines[i]
          if (found.title < 0 && H1.test(line))
            found.title = i
          if (found.status < 0 && STATUS.test(line))
            found.status = i
          if (found.nextMoveLoose < 0 && NEXT_MOVE_LOOSE.test(line))
            found.nextMoveLoose = i
          if (found.nextMove < 0 && NEXT_MOVE.test(line))
            found.nextMove = i
          if (found.doneMeans < 0 && DONE_MEANS.test(line))
            found.doneMeans = i
          if (found.ledger < 0 && LEDGER.test(line))
            found.ledger = i
          if (found.log < 0 && LOG.test(line))
            found.log = i
          if (found.log >= 0 && i > found.log && LOG_ENTRY.test(line))
            datedLogEntry = true
        }

        const at = (line: number) => ({
          start: { line: line + 1, column: 1 },
          end: { line: line + 1, column: Math.max(1, (lines[line]?.length ?? 0) + 1) },
        })
        const top = { start: { line: 1, column: 1 }, end: { line: 1, column: 1 } }

        if (required.has('title') && found.title < 0)
          context.report({ loc: top, messageId: 'missingTitle' })
        if (required.has('status') && found.status < 0)
          context.report({ loc: top, messageId: 'missingStatus' })
        if (required.has('nextMove')) {
          if (found.nextMoveLoose < 0)
            context.report({ loc: top, messageId: 'missingNextMove' })
          else if (found.nextMove < 0)
            context.report({ loc: at(found.nextMoveLoose), messageId: 'badNextMove', data: { buckets: buckets.join(', ') } })
        }
        if (required.has('doneMeans') && found.doneMeans < 0)
          context.report({ loc: top, messageId: 'missingDoneMeans' })
        if (required.has('ledger') && found.ledger < 0)
          context.report({ loc: top, messageId: 'missingLedger' })
        if (required.has('log')) {
          if (found.log < 0)
            context.report({ loc: top, messageId: 'missingLog' })
          else if (!datedLogEntry)
            context.report({ loc: at(found.log), messageId: 'undatedLog' })
        }
      },
    }
  },
}
