import { IconDocument, IconPen, IconTrash, IconCheck, IconX } from '../../components/ui/Icons'
import Loading from '../../components/ui/Loading'
import s from '../Admin.module.css'

export default function CategoryRow({
  cat,
  isEditing,
  editTitle,
  editDesc,
  editLoading,
  onEditTitleChange,
  onEditDescChange,
  onSaveEdit,
  onCancelEdit,
  onStartEdit,
  onDelete,
}) {
  if (isEditing) {
    return (
      <div className={s.categoryEditForm}>
        <input
          className={s.input}
          type="text"
          value={editTitle}
          onChange={(e) => onEditTitleChange(e.target.value)}
          placeholder="Title"
        />
        <input
          className={s.input}
          type="text"
          value={editDesc}
          onChange={(e) => onEditDescChange(e.target.value)}
          placeholder="Description"
        />
        <div className={s.categoryEditActions}>
          <button
            className={s.btnPrimary}
            onClick={() => onSaveEdit(cat)}
            disabled={editLoading || !editTitle.trim()}
            type="button"
            title="Save category"
          >
            {editLoading ? (
              <Loading inline size="small" variant="light" message="Saving…" />
            ) : (
              <>
                <IconCheck size={14} />
                <span className={s.actionBtnLabel}>Save</span>
              </>
            )}
          </button>
          <button className={s.btnGhost} onClick={onCancelEdit} type="button" title="Cancel editing">
            <IconX size={14} />
            <span className={s.actionBtnLabel}>Cancel</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className={s.categoryInfo}>
        <span className={s.categoryTitle}>{cat.title}</span>
        {cat.description && (
          <span className={s.categoryDesc}>
            {cat.description.length > 100
              ? cat.description.slice(0, 100) + '…'
              : cat.description}
          </span>
        )}
        {cat.post_count != null && (
          <span className={s.categoryMeta}>
            <IconDocument size={12} />
            {cat.post_count} posts
          </span>
        )}
      </div>
      <div className={s.actions}>
        <button
          className={s.actionBtn}
          onClick={() => onStartEdit(cat)}
          title="Edit category"
          type="button"
        >
          <IconPen size={14} />
          <span className={s.actionBtnLabel}>Edit</span>
        </button>
        <button
          className={`${s.actionBtn} ${s.actionDangerBtn}`}
          onClick={() => onDelete(cat)}
          title="Delete category"
          type="button"
        >
          <IconTrash size={14} />
          <span className={s.actionBtnLabel}>Delete</span>
        </button>
      </div>
    </>
  )
}
