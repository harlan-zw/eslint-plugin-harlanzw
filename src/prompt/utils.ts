export function getCodeBlockLines(lines: string[]): Set<number> {
  const codeLines = new Set<number>()
  let inCodeBlock = false

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trimStart()
    if (trimmed.startsWith('```')) {
      codeLines.add(i)
      inCodeBlock = !inCodeBlock
    }
    else if (inCodeBlock) {
      codeLines.add(i)
    }
  }

  return codeLines
}

export function getFrontmatterEnd(lines: string[]): number {
  if (lines.length === 0 || lines[0].trim() !== '---')
    return 0

  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---')
      return i + 1
  }

  return 0
}

export function shouldSkipLine(lineIndex: number, codeBlockLines: Set<number>, frontmatterEnd: number): boolean {
  return codeBlockLines.has(lineIndex) || lineIndex < frontmatterEnd
}

// --- Inline scope tracking ---

export type MarkdownScopeType = 'code' | 'link-text' | 'link-url'

export interface MarkdownScope {
  start: number
  end: number
  type: MarkdownScopeType
}

/**
 * Parse a single markdown line into scope ranges.
 * Walks the line character-by-character tracking inline code spans and links.
 * Call once per line, then query with `isInScope`.
 */
export function parseLineScopes(line: string): MarkdownScope[] {
  const scopes: MarkdownScope[] = []
  let i = 0

  while (i < line.length) {
    // Inline code span — handle variable-length backtick delimiters
    if (line[i] === '`') {
      const openStart = i
      let ticks = 0
      while (i < line.length && line[i] === '`') {
        ticks++
        i++
      }
      // Find matching closing backtick sequence
      const closeIdx = line.indexOf('`'.repeat(ticks), i)
      if (closeIdx !== -1) {
        scopes.push({ start: openStart, end: closeIdx + ticks, type: 'code' })
        i = closeIdx + ticks
      }
      // If no closing found, the rest of the line is not code — continue
      continue
    }

    // Markdown link: [text](url) or image ![alt](url)
    // Images are treated same as links for scope purposes
    if ((line[i] === '[') || (line[i] === '!' && line[i + 1] === '[')) {
      const fullStart = i
      if (line[i] === '!')
        i++ // skip !
      i++ // skip [

      const textStart = i

      // Find closing ] — handle nested brackets
      let depth = 1
      while (i < line.length && depth > 0) {
        if (line[i] === '`') {
          // Skip inline code within link text
          const bt = i
          let n = 0
          while (i < line.length && line[i] === '`') {
            n++
            i++
          }
          const ci = line.indexOf('`'.repeat(n), i)
          if (ci !== -1) {
            i = ci + n
            continue
          }
          i = bt + 1
          continue
        }
        if (line[i] === '[')
          depth++
        else if (line[i] === ']')
          depth--
        if (depth > 0)
          i++
      }

      // Must find ] followed by (
      if (i < line.length && depth === 0 && line[i + 1] === '(') {
        const textEnd = i // position of ]
        scopes.push({ start: textStart, end: textEnd, type: 'link-text' })

        i += 2 // skip ](
        const urlStart = i

        // Find closing ) — handle nested parens
        let parenDepth = 1
        while (i < line.length && parenDepth > 0) {
          if (line[i] === '(')
            parenDepth++
          else if (line[i] === ')')
            parenDepth--
          if (parenDepth > 0)
            i++
        }

        if (i < line.length && parenDepth === 0) {
          scopes.push({ start: urlStart, end: i, type: 'link-url' })
          i++ // skip )
        }
        continue
      }

      // Not a valid link — backtrack to after the opening [ and continue
      i = fullStart + 1
      continue
    }

    i++
  }

  return scopes
}

/**
 * Check if a match range overlaps with any scope of the given types.
 */
export function isInScope(scopes: MarkdownScope[], matchStart: number, matchEnd: number, types: MarkdownScopeType[]): boolean {
  return scopes.some(s => types.includes(s.type) && matchStart >= s.start && matchEnd <= s.end)
}

// --- Frontmatter parsing ---

export interface FrontmatterField {
  key: string
  value: string
  lineIndex: number
}

export interface ParsedFrontmatter {
  exists: boolean
  startLine: number
  endLine: number
  fields: FrontmatterField[]
}

export function parseFrontmatter(lines: string[]): ParsedFrontmatter {
  const result: ParsedFrontmatter = { exists: false, startLine: -1, endLine: -1, fields: [] }

  if (lines.length === 0 || lines[0].trim() !== '---')
    return result

  let closingLine = -1
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      closingLine = i
      break
    }
  }

  if (closingLine === -1)
    return result

  result.exists = true
  result.startLine = 0
  result.endLine = closingLine

  for (let i = 1; i < closingLine; i++) {
    const line = lines[i]
    // Skip indented lines (nested YAML values under a parent key)
    if (line.length > 0 && (line[0] === ' ' || line[0] === '\t'))
      continue
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1)
      continue
    const key = line.slice(0, colonIdx).trim()
    const value = line.slice(colonIdx + 1).trim()
    if (key)
      result.fields.push({ key, value, lineIndex: i })
  }

  return result
}
