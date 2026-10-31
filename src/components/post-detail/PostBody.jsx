import { useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import {
  IMAGE_EXTENSIONS,
  getExtension,
  getDisplayName,
  getFileIcon,
  getAttachmentUrl,
} from '../../utils/attachments'
import { MARKDOWN_PLUGINS, MARKDOWN_COMPONENTS } from '../../utils/markdown'
import { IconDownload, IconImageOff } from '../ui/Icons'
import ExpandableContent from '../ui/ExpandableContent'
import Lightbox from '../ui/Lightbox'
import s from './PostBody.module.css'

const COLLAPSED_HEIGHT = 320

function ImageAttachment({ url, filename, onClick }) {
  const [broken, setBroken] = useState(false)

  if (broken) {
    return (
      <div className={s.imageAttachment}>
        <div className={s.imageFallback}>
          <IconImageOff size={22} />
          <span>Image not found</span>
        </div>
      </div>
    )
  }

  return (
    <button type="button" className={s.imageAttachment} onClick={onClick}>
      <img
        src={url}
        alt={getDisplayName(filename)}
        className={s.imageThumb}
        onError={() => setBroken(true)}
      />
    </button>
  )
}

function AttachmentItem({ postId, filename, onImageClick }) {
  const url = getAttachmentUrl(postId, filename)
  const extension = getExtension(filename)
  const isImage = IMAGE_EXTENSIONS.includes(extension)

  if (isImage) {
    return <ImageAttachment url={url} filename={filename} onClick={onImageClick} />
  }

  return (
    <a href={url} download className={s.fileAttachment}>
      {getFileIcon(extension, 16)}
      <span className={s.fileName}>{getDisplayName(filename)}</span>
      <IconDownload size={14} className={s.downloadIcon} />
    </a>
  )
}

export default function PostBody({ post }) {
  const [lightboxIndex, setLightboxIndex] = useState(null)

  const attachments = useMemo(() => post.attachments || [], [post.attachments])

  const images = useMemo(
    () =>
      attachments
        .filter((filename) => IMAGE_EXTENSIONS.includes(getExtension(filename)))
        .map((filename) => ({
          src: getAttachmentUrl(post.id, filename),
          alt: getDisplayName(filename),
        })),
    [attachments, post.id]
  )

  function handleImageClick(filename) {
    const idx = images.findIndex((img) => img.src === getAttachmentUrl(post.id, filename))
    if (idx !== -1) setLightboxIndex(idx)
  }

  return (
    <div className={s.body}>
      <ExpandableContent
        maxHeight={COLLAPSED_HEIGHT}
        watchKey={post.content}
        className={`${s.content} markdown-content`}
        collapsedClassName={s.collapsed}
        toggleClassName={s.showMoreBtn}
      >
        <ReactMarkdown remarkPlugins={MARKDOWN_PLUGINS} components={MARKDOWN_COMPONENTS}>
          {post.content}
        </ReactMarkdown>
      </ExpandableContent>

      {attachments.length > 0 && (
        <div className={s.attachments}>
          {attachments.map((filename) => (
            <AttachmentItem
              key={filename}
              postId={post.id}
              filename={filename}
              onImageClick={() => handleImageClick(filename)}
            />
          ))}
        </div>
      )}

      {lightboxIndex !== null && (
        <Lightbox images={images} startIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
      )}
    </div>
  )
}
