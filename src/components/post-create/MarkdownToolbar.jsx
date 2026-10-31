import { IconBold, IconItalic, IconHeading, IconList, IconCode, IconCodeBlock, IconTable } from '../ui/Icons'
import s from './MarkdownToolbar.module.css'

const BUTTONS = [
  { type: 'bold', label: 'Bold', icon: IconBold },
  { type: 'italic', label: 'Italic', icon: IconItalic },
  { type: 'heading', label: 'Heading', icon: IconHeading },
  { type: 'list', label: 'List item', icon: IconList },
  { type: 'code', label: 'Inline code', icon: IconCode },
  { type: 'codeBlock', label: 'Code block', icon: IconCodeBlock },
  { type: 'table', label: 'Table', icon: IconTable },
]

export default function MarkdownToolbar({ onFormat }) {
  return (
    <div className={s.toolbar} role="toolbar" aria-label="Markdown formatting">
      {BUTTONS.map(({ type, label, icon: Icon }) => (
        <button
          key={type}
          type="button"
          className={s.toolBtn}
          title={label}
          aria-label={label}
          onClick={() => onFormat(type)}
        >
          <Icon size={14} />
        </button>
      ))}
    </div>
  )
}
