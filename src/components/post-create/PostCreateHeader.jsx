import { MultiSelectDropdown } from '../ui/MultiSelectDropdown'
import { IconPlus, IconPencil, IconX } from '../ui/Icons'
import s from './PostCreateHeader.module.css'

export default function PostCreateHeader({
  mode = 'create',
  title,
  onTitleChange,
  titleError,
  selectedCategories,
  categoryOptions,
  onCategoriesChange,
}) {
  const triggerLabel =
    selectedCategories.length === 0
      ? 'Add categories'
      : selectedCategories.length === 1
        ? selectedCategories[0]
        : `${selectedCategories.length} categories`

  const Icon = mode === 'edit' ? IconPencil : IconPlus
  const label = mode === 'edit' ? 'Edit Post' : 'New Post'

  return (
    <div className={s.header}>
      <div className={s.headerLabelWrap}>
        <Icon size={18} />
        <h1 className={s.headerLabel}>{label}</h1>
      </div>

      <input
        type="text"
        className={`${s.titleInput} ${titleError ? s.invalid : ''}`}
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="Post title"
        maxLength={255}
        aria-label="Post title"
      />
      {titleError && <span className={s.fieldError}>{titleError}</span>}

      <MultiSelectDropdown
        className={s.categoryDropdown}
        selectedValues={selectedCategories}
        options={categoryOptions}
        onChange={onCategoriesChange}
        triggerLabel={triggerLabel}
        emptyLabel="No categories available"
      />

      {selectedCategories.length > 0 && (
        <div className={s.categories}>
          {selectedCategories.map((title) => (
            <span key={title} className={s.categoryTag}>
              {title}
              {mode === 'edit' && (
                <button
                  type="button"
                  className={s.categoryTagRemove}
                  onClick={() => onCategoriesChange(selectedCategories.filter((c) => c !== title))}
                  aria-label={`Remove category: ${title}`}
                  title={`Remove category: ${title}`}
                >
                  <IconX size={10} />
                </button>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
