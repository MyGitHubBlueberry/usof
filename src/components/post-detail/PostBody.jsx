import { useLayoutEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { API } from '../../constants/api'
import { IconFile, IconDownload, IconChevron } from '../ui/Icons'
import s from './PostBody.module.css'

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg']
const COLLAPSED_HEIGHT = 320

function getExtension(filename) {
  const idx = filename.lastIndexOf('.')
  return idx === -1 ? '' : filename.slice(idx).toLowerCase()
}

function getAttachmentUrl(postId, filename) {
  return `${import.meta.env.VITE_API_URL}${API.POSTS.ATTACHMENT(postId, filename)}`
}

function AttachmentItem({ postId, filename }) {
  const url = getAttachmentUrl(postId, filename)
  const isImage = IMAGE_EXTENSIONS.includes(getExtension(filename))

  if (isImage) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className={s.imageAttachment}>
        <img src={url} alt={filename} className={s.imageThumb} />
      </a>
    )
  }

  return (
    <a href={url} download className={s.fileAttachment}>
      <IconFile size={16} />
      <span className={s.fileName}>{filename}</span>
      <IconDownload size={14} className={s.downloadIcon} />
    </a>
  )
}

export default function PostBody({ post }) {
  const contentRef = useRef(null)
  const [collapsed, setCollapsed] = useState(true)
  const [canExpand, setCanExpand] = useState(false)

  useLayoutEffect(() => {
    if (contentRef.current) {
      setCanExpand(contentRef.current.scrollHeight > COLLAPSED_HEIGHT)
    }
  }, [post.content])

  const attachments = post.attachments || []

  return (
    <div className={s.body}>
      <div
        ref={contentRef}
        className={`${s.content} ${collapsed && canExpand ? s.collapsed : ''}`}
      >
        <ReactMarkdown>{post.content}</ReactMarkdown>
      </div>

      {canExpand && (
        <button
          type="button"
          className={s.showMoreBtn}
          onClick={() => setCollapsed((v) => !v)}
        >
          <span>{collapsed ? 'Show more' : 'Show less'}</span>
          <IconChevron up={!collapsed} size={12} />
        </button>
      )}

      {attachments.length > 0 && (
        <div className={s.attachments}>
          {attachments.map((filename) => (
            <AttachmentItem key={filename} postId={post.id} filename={filename} />
          ))}
        </div>
      )}
    </div>
  )
}
