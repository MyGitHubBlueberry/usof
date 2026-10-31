import { MultiSelectDropdown } from '../ui/MultiSelectDropdown'
import s from './PostCreateHeader.module.css'

export default function PostCreateHeader({
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

  return (
    <div className={s.header}>
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
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
