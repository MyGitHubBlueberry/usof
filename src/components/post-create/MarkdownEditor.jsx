import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { MARKDOWN_PLUGINS, MARKDOWN_COMPONENTS } from '../../utils/markdown'
import { useMarkdownFormatting } from '../../hooks/useMarkdownFormatting'
import ExpandableContent from '../ui/ExpandableContent'
import MarkdownToolbar from './MarkdownToolbar'
import s from './MarkdownEditor.module.css'

const PREVIEW_COLLAPSED_HEIGHT = 320

export default function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Write your post in Markdown…',
  error,
  rows = 12,
}) {
  const [mode, setMode] = useState('write')
  const { textareaRef, applyFormat } = useMarkdownFormatting(value, onChange)

  return (
    <div className={s.editor}>
      <div className={s.tabs} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'write'}
          className={`${s.tab} ${mode === 'write' ? s.tabActive : ''}`}
          onClick={() => setMode('write')}
        >
        //todo: icon
          <span>Write</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'preview'}
          className={`${s.tab} ${mode === 'preview' ? s.tabActive : ''}`}
          onClick={() => setMode('preview')}
        >
          //todo:icon
          <span>Preview</span>
        </button>
      </div>

      {mode === 'write' ? (
        <div className={s.writeGroup}>
          <MarkdownToolbar onFormat={applyFormat} />
          <textarea
            ref={textareaRef}
            className={`${s.textarea} ${error ? s.invalid : ''}`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
          />
        </div>
      ) : (
        <ExpandableContent
          maxHeight={PREVIEW_COLLAPSED_HEIGHT}
          watchKey={value}
          className={`${s.preview} markdown-content`}
          collapsedClassName={s.previewCollapsed}
          toggleClassName={s.showMoreBtn}
        >
          {value.trim() ? (
            <ReactMarkdown remarkPlugins={MARKDOWN_PLUGINS} components={MARKDOWN_COMPONENTS}>
              {value}
            </ReactMarkdown>
          ) : (
            <span className={s.previewEmpty}>Nothing to preview yet.</span>
          )}
        </ExpandableContent>
      )}

      {error && <span className={s.fieldError}>{error}</span>}
    </div>
  )
}
