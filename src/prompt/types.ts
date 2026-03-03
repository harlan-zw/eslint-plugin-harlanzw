export interface PromptPosition {
  start: { line: number, column: number, offset: number }
  end: { line: number, column: number, offset: number }
}

export interface LineNode {
  type: 'line'
  value: string
  position: PromptPosition
}

export interface DocumentNode {
  type: 'document'
  children: LineNode[]
  position: PromptPosition
}

export type PromptNode = DocumentNode | LineNode
