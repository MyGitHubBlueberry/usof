import { useEffect, useMemo, useRef } from 'react'
import { IMAGE_EXTENSIONS, getExtension, getDisplayName, getFileIcon } from '../../utils/attachments'
import { IconPlus, IconX } from '../ui/Icons'
import s from './AttachmentUploader.module.css'
import grid from '../ui/AttachmentGrid.module.css'

const MAX_ATTACHMENTS = 10

export default function AttachmentUploader({ files, onChange }) {
  const inputRef = useRef(null)

  const previewUrls = useMemo(
    () => files.map((file) => (IMAGE_EXTENSIONS.includes(getExtension(file.name)) ? URL.createObjectURL(file) : null)),
    [files]
  )

  useEffect(() => {
    return () => previewUrls.forEach((url) => url && URL.revokeObjectURL(url))
  }, [previewUrls])

  function handlePick() {
    if (files.length >= MAX_ATTACHMENTS) return
    inputRef.current?.click()
  }

  function handleFilesSelected(e) {
    const picked = Array.from(e.target.files || [])
    e.target.value = ''
    if (!picked.length) return
    onChange([...files, ...picked].slice(0, MAX_ATTACHMENTS))
  }

  function removeFile(idx) {
    onChange(files.filter((_, i) => i !== idx))
  }

  return (
    <div className={s.uploader}>
      <div className={s.header}>
        <span className={s.label}>Attachments</span>
        <button
          type="button"
          className={s.addBtn}
          onClick={handlePick}
          disabled={files.length >= MAX_ATTACHMENTS}
        >
          <IconPlus size={12} />
          <span>Add file</span>
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          className={s.hiddenInput}
          onChange={handleFilesSelected}
        />
      </div>

      {files.length > 0 && (
        <div className={grid.attachments}>
          {files.map((file, idx) => {
            const extension = getExtension(file.name)
            const isImage = IMAGE_EXTENSIONS.includes(extension)
            return (
              <div key={`${file.name}-${idx}`} className={grid.imageAttachment}>
                {isImage ? (
                  <img src={previewUrls[idx]} alt={file.name} className={grid.imageThumb} />
                ) : (
                  <div className={grid.fileContent}>
                    <span className={grid.fileTypeIcon}>{getFileIcon(extension, 28)}</span>
                    <span className={grid.fileName}>{getDisplayName(file.name)}</span>
                  </div>
                )}
                <div className={grid.overlayActions}>
                  <button
                    type="button"
                    className={`${grid.overlayBtn} ${grid.overlayBtnDanger}`}
                    onClick={() => removeFile(idx)}
                    aria-label={`Remove ${file.name}`}
                    title="Remove attachment"
                  >
                    <IconX size={13} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {files.length >= MAX_ATTACHMENTS && (
        <span className={s.limitNote}>Maximum of {MAX_ATTACHMENTS} attachments.</span>
      )}
    </div>
  )
}
