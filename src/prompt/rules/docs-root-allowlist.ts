import { basename, dirname, resolve } from 'node:path'

// The repository root holds identity and filters only: documents that are true
// today, carry no status, and never close. Everything else has a lifecycle
// folder under docs/.
const DEFAULT_ALLOW = [
  'README.md',
  'AGENTS.md',
  'GLOSSARY.md',
  'VISION.md',
  'DESIGN.md',
  'COPY.md',
  'CONTRIBUTING.md',
  'CHANGELOG.md',
  'LICENSE.md',
  'SECURITY.md',
  'CODE_OF_CONDUCT.md',
]

export default {
  meta: {
    type: 'problem' as const,
    docs: { description: 'Forbid new Markdown at the repository root outside the root-docs allowlist' },
    schema: [{
      type: 'object' as const,
      properties: {
        root: { type: 'string' as const },
        allow: { type: 'array' as const, items: { type: 'string' as const } },
        additionalAllow: { type: 'array' as const, items: { type: 'string' as const } },
      },
      additionalProperties: false,
    }],
    messages: {
      notAllowed: '`{{name}}` is new Markdown at the repository root. Ideas go to `docs/ideas/`, briefs to `docs/work/`, reference to `docs/arch/`. The root holds identity and filters only.',
    },
  },
  create(context: any) {
    const options = context.options?.[0] ?? {}
    const filename: string = context.filename ?? ''
    if (!filename.endsWith('.md'))
      return {}

    const root = resolve(options.root ?? context.cwd ?? process.cwd())
    if (resolve(dirname(filename)) !== root)
      return {}

    const name = basename(filename)
    // A dotfile at the root is scratch until someone tracks it.
    if (name.startsWith('.'))
      return {}

    const allow = new Set<string>([...(options.allow ?? DEFAULT_ALLOW), ...(options.additionalAllow ?? [])])
    if (allow.has(name))
      return {}

    return {
      document() {
        context.report({
          loc: { start: { line: 1, column: 1 }, end: { line: 1, column: 1 } },
          messageId: 'notAllowed',
          data: { name },
        })
      },
    }
  },
}
