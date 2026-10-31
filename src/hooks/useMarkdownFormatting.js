import { useRef } from 'react'
import { insertMarkdownSyntax } from '../utils/markdownFormat'

export function useMarkdownFormatting(value, onChange) {
  const textareaRef = useRef(null)

  function applyFormat(type) {
    const textarea = textareaRef.current
    if (!textarea) return

    const { value: nextValue, selectionStart, selectionEnd } = insertMarkdownSyntax(
      value,
      textarea.selectionStart,
      textarea.selectionEnd,
      type
    )

    onChange(nextValue)

    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(selectionStart, selectionEnd)
    })
  }

  return { textareaRef, applyFormat }
}
