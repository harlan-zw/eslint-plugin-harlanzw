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
