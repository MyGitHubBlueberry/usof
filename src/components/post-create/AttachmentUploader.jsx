import { useEffect, useMemo, useRef } from 'react'
import { IMAGE_EXTENSIONS, getExtension, getDisplayName, getFileIcon } from '../../utils/attachments'
import { IconPlus, IconX } from '../ui/Icons'
import s from './AttachmentUploader.module.css'

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
        <div className={s.list}>
          {files.map((file, idx) => {
            const extension = getExtension(file.name)
            const isImage = IMAGE_EXTENSIONS.includes(extension)
            return (
              <div key={`${file.name}-${idx}`} className={s.item}>
                {isImage ? (
                  <img src={previewUrls[idx]} alt={file.name} className={s.thumb} />
                ) : (
                  <span className={s.fileIcon}>{getFileIcon(extension, 16)}</span>
                )}
                <span className={s.fileName}>{getDisplayName(file.name)}</span>
                <button
                  type="button"
                  className={s.removeBtn}
                  onClick={() => removeFile(idx)}
                  aria-label={`Remove ${file.name}`}
                  title="Remove attachment"
                >
                  <IconX size={11} />
                </button>
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
