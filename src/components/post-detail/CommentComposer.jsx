import Avatar from '../ui/Avatar'
import MarkdownToolbar from '../post-create/MarkdownToolbar'
import { IconSend } from '../ui/Icons'
import s from './CommentsSection.module.css'

export default function CommentComposer({
  currentUser,
  value,
  onChange,
  onSubmit,
  posting,
  textareaRef,
  onFormat,
}) {
  function handleKeyDown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      onSubmit()
    }
  }

  return (
    <div className={s.composer}>
      <Avatar
        userId={currentUser.id}
        avatarPath={currentUser.profile_picture_path}
        name={currentUser.login}
        size="small"
      />
      <div className={s.composerBody}>
        <span className={s.composerName}>{currentUser.login}</span>
        <div className={s.inputGroup}>
          <MarkdownToolbar onFormat={onFormat} />
          <textarea
            ref={textareaRef}
            className={s.textarea}
            placeholder="Share your thoughts..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={posting}
            rows={3}
          />
        </div>
        <div className={s.composerActions}>
          <button
            type="button"
            className={s.sendBtn}
            onClick={onSubmit}
            disabled={posting || !value.trim()}
          >
            <IconSend size={14} />
            <span>Send</span>
          </button>
        </div>
      </div>
    </div>
  )
}
