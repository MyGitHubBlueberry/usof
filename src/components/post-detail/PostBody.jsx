import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { API } from '../../constants/api'
import {
  IconFile,
  IconFilePdf,
  IconFileArchive,
  IconFileCode,
  IconFileSpreadsheet,
  IconDownload,
  IconChevron,
  IconImageOff,
} from '../ui/Icons'
import Lightbox from '../ui/Lightbox'
import s from './PostBody.module.css'

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg']
const PDF_EXTENSIONS = ['.pdf']
const ARCHIVE_EXTENSIONS = ['.zip', '.rar', '.7z', '.tar', '.gz']
const CODE_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.c', '.cpp', '.json', '.html', '.css', '.sql', '.sh']
const SPREADSHEET_EXTENSIONS = ['.xls', '.xlsx', '.csv']
const COLLAPSED_HEIGHT = 320

function getExtension(filename) {
  const idx = filename.lastIndexOf('.')
  return idx === -1 ? '' : filename.slice(idx).toLowerCase()
}

function getDisplayName(filename) {
  return filename.split('/').pop()
}

function renderFileIcon(extension, size) {
  if (PDF_EXTENSIONS.includes(extension)) return <IconFilePdf size={size} />
  if (ARCHIVE_EXTENSIONS.includes(extension)) return <IconFileArchive size={size} />
  if (CODE_EXTENSIONS.includes(extension)) return <IconFileCode size={size} />
  if (SPREADSHEET_EXTENSIONS.includes(extension)) return <IconFileSpreadsheet size={size} />
  return <IconFile size={size} />
}

function getAttachmentUrl(postId, filename) {
  return `${import.meta.env.VITE_API_URL}${API.POSTS.ATTACHMENT(postId, filename)}`
}

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
      {renderFileIcon(extension, 16)}
      <span className={s.fileName}>{getDisplayName(filename)}</span>
      <IconDownload size={14} className={s.downloadIcon} />
    </a>
  )
}

export default function PostBody({ post }) {
  const contentRef = useRef(null)
  const [collapsed, setCollapsed] = useState(true)
  const [canExpand, setCanExpand] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(null)

  useLayoutEffect(() => {
    if (contentRef.current) {
      setCanExpand(contentRef.current.scrollHeight > COLLAPSED_HEIGHT)
    }
  }, [post.content])

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
