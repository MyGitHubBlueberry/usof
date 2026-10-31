const WRAP_FORMATS = {
  bold: { prefix: '**', suffix: '**', placeholder: 'bold text' },
  italic: { prefix: '_', suffix: '_', placeholder: 'italic text' },
  code: { prefix: '`', suffix: '`', placeholder: 'code' },
}

const BLOCK_FORMATS = {
  heading: { prefix: '## ', suffix: '', placeholder: 'Heading' },
  list: { prefix: '- ', suffix: '', placeholder: 'List item' },
  codeBlock: { prefix: '```\n', suffix: '\n```', placeholder: 'code' },
}

const TABLE_TEMPLATE = '| Header 1 | Header 2 |\n| --- | --- |\n| Cell 1 | Cell 2 |'

export function insertMarkdownSyntax(value, start, end, type) {
  if (type === 'table') {
    const needsLeadingNewline = start > 0 && value[start - 1] !== '\n'
    const insert = `${needsLeadingNewline ? '\n' : ''}${TABLE_TEMPLATE}\n`
    const newValue = value.slice(0, start) + insert + value.slice(end)
    const cursor = start + insert.length
    return { value: newValue, selectionStart: cursor, selectionEnd: cursor }
  }

  const blockFormat = BLOCK_FORMATS[type]
  if (blockFormat) {
    const selected = value.slice(start, end)
    const text = selected || blockFormat.placeholder
    const lead = start > 0 && value[start - 1] !== '\n' ? '\n' : ''
    const insert = `${lead}${blockFormat.prefix}${text}${blockFormat.suffix}`
    const newValue = value.slice(0, start) + insert + value.slice(end)
    const selStart = start + lead.length + blockFormat.prefix.length
    return { value: newValue, selectionStart: selStart, selectionEnd: selStart + text.length }
  }

  const wrapFormat = WRAP_FORMATS[type]
  if (!wrapFormat) return { value, selectionStart: start, selectionEnd: end }

  const selected = value.slice(start, end)
  const text = selected || wrapFormat.placeholder
  const insert = `${wrapFormat.prefix}${text}${wrapFormat.suffix}`
  const newValue = value.slice(0, start) + insert + value.slice(end)
  const selStart = start + wrapFormat.prefix.length

  return { value: newValue, selectionStart: selStart, selectionEnd: selStart + text.length }
}
