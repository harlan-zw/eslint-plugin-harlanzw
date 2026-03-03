import { describe, expect, it } from 'vitest'
import { PromptLanguage, PromptSourceCode } from './language'

describe('promptLanguage', () => {
  const lang = new PromptLanguage()

  it('parses text into document with lines', () => {
    const result = lang.parse({ body: 'line one\nline two\nline three' })
    expect(result.ok).toBe(true)
    expect(result.ast.type).toBe('document')
    expect(result.ast.children).toHaveLength(3)
    expect(result.ast.children[0].value).toBe('line one')
    expect(result.ast.children[1].value).toBe('line two')
    expect(result.ast.children[2].value).toBe('line three')
  })

  it('sets correct positions', () => {
    const result = lang.parse({ body: 'abc\ndef' })
    const [line1, line2] = result.ast.children

    expect(line1.position.start).toEqual({ line: 1, column: 1, offset: 0 })
    expect(line1.position.end).toEqual({ line: 1, column: 4, offset: 3 })

    expect(line2.position.start).toEqual({ line: 2, column: 1, offset: 4 })
    expect(line2.position.end).toEqual({ line: 2, column: 4, offset: 7 })
  })

  it('creates source code', () => {
    const text = 'hello\nworld'
    const parseResult = lang.parse({ body: text })
    const sc = lang.createSourceCode({ body: text }, parseResult)
    expect(sc).toBeInstanceOf(PromptSourceCode)
    expect(sc.lines).toHaveLength(2)
  })

  it('handles empty text', () => {
    const result = lang.parse({ body: '' })
    expect(result.ast.children).toHaveLength(1)
    expect(result.ast.children[0].value).toBe('')
  })
})

describe('promptSourceCode', () => {
  const lang = new PromptLanguage()

  it('supports eslint-disable comments', () => {
    const text = '<!-- eslint-disable prompt/weak-instruction -->\nYou could do this.'
    const parseResult = lang.parse({ body: text })
    const sc = lang.createSourceCode({ body: text }, parseResult)
    const { directives } = sc.getDisableDirectives()
    expect(directives).toHaveLength(1)
    expect(directives[0].type).toBe('disable')
  })

  it('traverses document and line nodes', () => {
    const text = 'a\nb'
    const parseResult = lang.parse({ body: text })
    const sc = lang.createSourceCode({ body: text }, parseResult)
    const steps = [...sc.traverse()]
    // document enter, line1 enter, line1 exit, line2 enter, line2 exit, document exit
    expect(steps).toHaveLength(6)
  })
})
