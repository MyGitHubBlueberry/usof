import { useState } from 'react'
import {
  IMAGE_EXTENSIONS,
  getExtension,
  getDisplayName,
  getFileIcon,
  getAttachmentUrl,
} from '../../utils/attachments'
import { IconDownload, IconImageOff, IconTrash } from './Icons'
import s from './AttachmentGrid.module.css'

function ImageAttachment({ url, filename, onClick, onRemove }) {
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
    <div className={s.imageAttachment}>
      <button type="button" className={s.imageBtn} onClick={onClick}>
        <img
          src={url}
          alt={getDisplayName(filename)}
          className={s.imageThumb}
          onError={() => setBroken(true)}
        />
      </button>
      <div className={s.overlayActions}>
        <a
          href={url}
          download
          className={s.overlayBtn}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Download ${getDisplayName(filename)}`}
          title="Download"
        >
          <IconDownload size={13} />
        </a>
        {onRemove && (
          <button
            type="button"
            className={`${s.overlayBtn} ${s.overlayBtnDanger}`}
            onClick={(e) => {
              e.stopPropagation()
              onRemove(filename)
            }}
            aria-label={`Remove ${getDisplayName(filename)}`}
            title="Remove attachment"
          >
            <IconTrash size={13} />
          </button>
        )}
      </div>
    </div>
  )
}

function FileAttachment({ url, filename, onRemove }) {
  const extension = getExtension(filename)

  return (
    <div className={s.imageAttachment}>
      <div className={s.fileContent}>
        <span className={s.fileTypeIcon}>{getFileIcon(extension, 28)}</span>
        <span className={s.fileName}>{getDisplayName(filename)}</span>
      </div>
      <div className={s.overlayActions}>
        <a
          href={url}
          download
          className={s.overlayBtn}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Download ${getDisplayName(filename)}`}
          title="Download"
        >
          <IconDownload size={13} />
        </a>
        {onRemove && (
          <button
            type="button"
            className={`${s.overlayBtn} ${s.overlayBtnDanger}`}
            onClick={(e) => {
              e.stopPropagation()
              onRemove(filename)
            }}
            aria-label={`Remove ${getDisplayName(filename)}`}
            title="Remove attachment"
          >
            <IconTrash size={13} />
          </button>
        )}
      </div>
    </div>
  )
}

export default function AttachmentGrid({ postId, attachments, onImageClick, onRemove }) {
  if (!attachments || attachments.length === 0) return null

  return (
    <div className={s.attachments}>
      {attachments.map((filename) => {
        const url = getAttachmentUrl(postId, filename)
        const extension = getExtension(filename)
        const isImage = IMAGE_EXTENSIONS.includes(extension)

        return isImage ? (
          <ImageAttachment
            key={filename}
            url={url}
            filename={filename}
            onClick={() => onImageClick?.(filename)}
            onRemove={onRemove}
          />
        ) : (
          <FileAttachment key={filename} url={url} filename={filename} onRemove={onRemove} />
        )
      })}
    </div>
  )
}
