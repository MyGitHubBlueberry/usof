import { useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { IMAGE_EXTENSIONS, getExtension, getDisplayName, getAttachmentUrl } from '../../utils/attachments'
import { MARKDOWN_PLUGINS, MARKDOWN_COMPONENTS } from '../../utils/markdown'
import ExpandableContent from '../ui/ExpandableContent'
import AttachmentGrid from '../ui/AttachmentGrid'
import Lightbox from '../ui/Lightbox'
import s from './PostBody.module.css'

const COLLAPSED_HEIGHT = 320

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

      <AttachmentGrid postId={post.id} attachments={attachments} onImageClick={handleImageClick} />

      {lightboxIndex !== null && (
        <Lightbox images={images} startIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
      )}
    </div>
  )
}
