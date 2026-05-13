import type { TSESTree } from '@typescript-eslint/utils'
import { createEslintRule } from '../utils'

export const RULE_NAME = 'prefer-node-style-text'
export type MessageIds = 'preferStyleText'
export type Options = []

const ESC_ALT = String.raw`(?:\\x1[bB]|\\u001[bB]|\\033|\x1B)`

const ANSI_ANYWHERE_RE = new RegExp(`${ESC_ALT}\\[[\\d;]*m`)

const FULL_WRAP_RE = new RegExp(`^${ESC_ALT}\\[([\\d;]+)m([\\s\\S]*?)${ESC_ALT}\\[0m$`)

const ANY_ANSI_RE = new RegExp(`${ESC_ALT}\\[`)

const SGR_NAMES: Record<string, string> = {
  0: 'reset',
  1: 'bold',
  2: 'dim',
  3: 'italic',
  4: 'underline',
  7: 'inverse',
  8: 'hidden',
  9: 'strikethrough',
  30: 'black',
  31: 'red',
  32: 'green',
  33: 'yellow',
  34: 'blue',
  35: 'magenta',
  36: 'cyan',
  37: 'white',
  90: 'gray',
  91: 'redBright',
  92: 'greenBright',
  93: 'yellowBright',
  94: 'blueBright',
  95: 'magentaBright',
  96: 'cyanBright',
  97: 'whiteBright',
  40: 'bgBlack',
  41: 'bgRed',
  42: 'bgGreen',
  43: 'bgYellow',
  44: 'bgBlue',
  45: 'bgMagenta',
  46: 'bgCyan',
  47: 'bgWhite',
}

function paramsToNames(params: string): string[] | null {
  const parts = params.split(';').filter(Boolean)
  const names = parts.map(p => SGR_NAMES[p])
  if (names.some(n => !n || n === 'reset'))
    return null
  return names
}

function describeCodes(raw: string): string {
  const m = raw.match(new RegExp(`${ESC_ALT}\\[([\\d;]*)m`))
  if (!m)
    return 'ANSI'
  const names = m[1].split(';').filter(Boolean).map(p => SGR_NAMES[p] || p)
  return names.join(', ') || 'ANSI'
}

function formatCodes(names: string[]): string {
  if (names.length === 1)
    return `'${names[0]}'`
  return `[${names.map(n => `'${n}'`).join(', ')}]`
}

export default createEslintRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    fixable: 'code',
    docs: {
      description: 'prefer `styleText` from `node:util` over raw ANSI escape sequences',
    },
    schema: [],
    messages: {
      preferStyleText: 'Avoid raw ANSI escape sequences ({{codes}}). Use `styleText` from `node:util` instead.',
    },
  },
  defaultOptions: [],
  create: (context) => {
    const sourceCode = context.sourceCode ?? context.getSourceCode()
    let program: TSESTree.Program | null = null
    let nodeUtilImport: TSESTree.ImportDeclaration | null = null
    let hasStyleText = false

    function ensureStyleTextImportFix(fixer: any): any[] {
      const fixes: any[] = []
      if (hasStyleText)
        return fixes
      if (nodeUtilImport) {
        // Add styleText specifier to existing import
        const specifiers = nodeUtilImport.specifiers.filter(
          s => s.type === 'ImportSpecifier',
        ) as TSESTree.ImportSpecifier[]
        if (specifiers.length > 0) {
          const last = specifiers[specifiers.length - 1]
          fixes.push(fixer.insertTextAfter(last, ', styleText'))
        }
        else {
          // Default-only import: add named import next to it
          const defaultSpec = nodeUtilImport.specifiers[0]
          if (defaultSpec)
            fixes.push(fixer.insertTextAfter(defaultSpec, ', { styleText }'))
        }
      }
      else if (program) {
        fixes.push(fixer.insertTextBefore(program.body[0], `import { styleText } from 'node:util'\n`))
      }
      return fixes
    }

    function buildReplacement(node: TSESTree.Literal | TSESTree.TemplateLiteral): { codes: string, replacement: string } | null {
      const text = sourceCode.getText(node)
      if (node.type === 'Literal') {
        if (typeof node.value !== 'string')
          return null
        const quote = text[0]
        if (quote !== '"' && quote !== '\'')
          return null
        const inner = text.slice(1, -1)
        const m = inner.match(FULL_WRAP_RE)
        if (!m)
          return null
        const names = paramsToNames(m[1])
        if (!names)
          return null
        const body = m[2]
        if (ANY_ANSI_RE.test(body))
          return null
        return {
          codes: names.join(', '),
          replacement: `styleText(${formatCodes(names)}, ${quote}${body}${quote})`,
        }
      }
      // TemplateLiteral: must not be tagged
      if ((node.parent as any)?.type === 'TaggedTemplateExpression')
        return null
      const inner = text.slice(1, -1) // strip backticks
      const m = inner.match(FULL_WRAP_RE)
      if (!m)
        return null
      const names = paramsToNames(m[1])
      if (!names)
        return null
      const body = m[2]
      if (ANY_ANSI_RE.test(body))
        return null
      return {
        codes: names.join(', '),
        replacement: `styleText(${formatCodes(names)}, \`${body}\`)`,
      }
    }

    function check(node: TSESTree.Literal | TSESTree.TemplateLiteral, raw: string) {
      if (!ANSI_ANYWHERE_RE.test(raw))
        return
      const codes = describeCodes(raw)
      const built = buildReplacement(node)
      context.report({
        node,
        messageId: 'preferStyleText',
        data: { codes },
        fix: built
          ? (fixer) => {
              const fixes = [fixer.replaceText(node, built.replacement), ...ensureStyleTextImportFix(fixer)]
              return fixes
            }
          : null,
      })
    }

    return {
      Program(node) {
        program = node
        for (const stmt of node.body) {
          if (stmt.type !== 'ImportDeclaration')
            continue
          if (stmt.source.value !== 'node:util' && stmt.source.value !== 'util')
            continue
          nodeUtilImport = stmt
          for (const spec of stmt.specifiers) {
            if (
              spec.type === 'ImportSpecifier'
              && spec.imported.type === 'Identifier'
              && spec.imported.name === 'styleText'
            ) {
              hasStyleText = true
            }
          }
        }
      },
      Literal(node) {
        if (typeof node.value !== 'string')
          return
        check(node, sourceCode.getText(node))
      },
      TemplateLiteral(node) {
        const text = sourceCode.getText(node)
        check(node, text)
      },
    }
  },
})
