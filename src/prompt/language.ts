import type { DocumentNode, LineNode, PromptNode } from './types'
import { ConfigCommentParser, Directive, TextSourceCodeBase, VisitNodeStep } from '@eslint/plugin-kit'

const REGEX_1 = /\r?\n/

const configCommentStart = /<!--\s*eslint(?:-enable|-disable(?:(?:-next)?-line)?)?(?:\s|-->)/u
const htmlCommentPattern = /<!--(.*?)-->/gsu
const commentParser = new ConfigCommentParser()

function locFromIndex(text: string, index: number): { line: number, column: number } {
  let line = 1
  let lastNewline = -1
  for (let i = 0; i < index; i++) {
    if (text[i] === '\n') {
      line++
      lastNewline = i
    }
  }
  return { line, column: index - lastNewline }
}

interface InlineConfigComment {
  value: string
  position: {
    start: { line: number, column: number, offset: number }
    end: { line: number, column: number, offset: number }
  }
}

export class PromptSourceCode extends TextSourceCodeBase {
  declare ast: DocumentNode
  #steps: VisitNodeStep[] | undefined
  #inlineConfigComments: InlineConfigComment[] | undefined

  constructor({ text, ast }: { text: string, ast: DocumentNode }) {
    super({ ast, text })
    this.ast = ast
    this.traverse()
  }

  getInlineConfigNodes(): InlineConfigComment[] {
    if (!this.#inlineConfigComments) {
      this.#inlineConfigComments = []
      const regex = new RegExp(htmlCommentPattern.source, htmlCommentPattern.flags)
      let match: RegExpExecArray | null
      while ((match = regex.exec(this.text)) !== null) {
        if (configCommentStart.test(match[0])) {
          const startOffset = match.index
          const endOffset = startOffset + match[0].length
          this.#inlineConfigComments.push({
            value: match[1].trim(),
            position: {
              start: { ...locFromIndex(this.text, startOffset), offset: startOffset },
              end: { ...locFromIndex(this.text, endOffset), offset: endOffset },
            },
          })
        }
      }
    }
    return this.#inlineConfigComments
  }

  getDisableDirectives(): { problems: any[], directives: Directive[] } {
    const problems: any[] = []
    const directives: Directive[] = []

    for (const comment of this.getInlineConfigNodes()) {
      const parsed = commentParser.parseDirective(comment.value)
      if (!parsed)
        continue
      const { label, value, justification } = parsed

      switch (label) {
        case 'eslint-disable':
        case 'eslint-enable':
        case 'eslint-disable-next-line':
        case 'eslint-disable-line': {
          directives.push(new Directive({
            type: label.slice('eslint-'.length) as any,
            node: comment,
            value,
            justification,
          }))
        }
      }
    }

    return { problems, directives }
  }

  applyInlineConfig(): { configs: any[], problems: any[] } {
    const problems: any[] = []
    const configs: any[] = []

    for (const comment of this.getInlineConfigNodes()) {
      const parsed = commentParser.parseDirective(comment.value)
      if (!parsed)
        continue
      const { label, value } = parsed

      if (label === 'eslint') {
        const parseResult = commentParser.parseJSONLikeConfig(value)
        if (parseResult.ok) {
          configs.push({ config: { rules: parseResult.config }, loc: comment.position })
        }
        else {
          problems.push({ ruleId: null, message: (parseResult as any).error.message, loc: comment.position })
        }
      }
    }

    return { configs, problems }
  }

  getParent(node: PromptNode): DocumentNode | undefined {
    if (node.type === 'line')
      return this.ast
    return undefined
  }

  traverse(): IterableIterator<VisitNodeStep> {
    if (this.#steps)
      return this.#steps.values()

    const steps: VisitNodeStep[] = this.#steps = []

    steps.push(new VisitNodeStep({ target: this.ast, phase: 1, args: [this.ast, undefined] }))

    for (const line of this.ast.children) {
      steps.push(new VisitNodeStep({ target: line, phase: 1, args: [line, this.ast] }))
      steps.push(new VisitNodeStep({ target: line, phase: 2, args: [line, this.ast] }))
    }

    steps.push(new VisitNodeStep({ target: this.ast, phase: 2, args: [this.ast, undefined] }))

    return steps.values()
  }
}

export class PromptLanguage {
  fileType = 'text' as const
  lineStart = 1 as const
  columnStart = 1 as const
  nodeTypeKey = 'type' as const
  defaultLanguageOptions = {}

  validateLanguageOptions(): void {}

  parse(file: { body: string | Uint8Array }): { ok: true, ast: DocumentNode } {
    const text = file.body as string // fileType='text' guarantees string
    const rawLines = text.split(REGEX_1)

    let offset = 0
    const children: LineNode[] = rawLines.map((value: string, i: number) => {
      const lineStart = offset
      const node: LineNode = {
        type: 'line',
        value,
        position: {
          start: { line: i + 1, column: 1, offset: lineStart },
          end: { line: i + 1, column: value.length + 1, offset: lineStart + value.length },
        },
      }
      offset += value.length + 1 // +1 for newline
      return node
    })

    const ast: DocumentNode = {
      type: 'document',
      children,
      position: {
        start: { line: 1, column: 1, offset: 0 },
        end: {
          line: rawLines.length,
          column: (rawLines.at(-1)?.length ?? 0) + 1,
          offset: text.length,
        },
      },
    }

    return { ok: true as const, ast }
  }

  createSourceCode(file: { body: string | Uint8Array }, parseResult: { ast: DocumentNode }): PromptSourceCode {
    return new PromptSourceCode({
      text: file.body as string,
      ast: parseResult.ast,
    })
  }
}
