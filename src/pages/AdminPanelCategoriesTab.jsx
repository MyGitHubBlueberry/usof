import { categoriesService } from '../services/categories.service'
import Pagination from '../components/ui/Pagination'
import FeedControls from '../components/posts/FeedControls'
import ActionModal from '../components/ui/ActionModal'
import { useFlash } from '../hooks/useFlash'
import { useState, useEffect } from 'react'
import { IconFilter, IconPlus } from '../components/ui/Icons'
import CategoryRow from './admin/CategoryRow'
import ErrorState from '../components/ui/ErrorState'
import Loading from '../components/ui/Loading'
import s from './Admin.module.css'

const CATS_PER_PAGE = 10

export default function CategoriesTab() {
  const [allCats, setAllCats] = useState([])
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [error, setError] = useState(null)
  const [retryCount, setRetryCount] = useState(0)
  const [loadedKey, setLoadedKey] = useState(null)

  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editLoading, setEditLoading] = useState(false)

  const [showAddModal, setShowAddModal] = useState(false)
  const [addTitle, setAddTitle] = useState('')
  const [addDesc, setAddDesc] = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const [deleteTargetCat, setDeleteTargetCat] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const { showFlash } = useFlash()

  const currentKey = `${retryCount}`
  const isLoading = loadedKey !== currentKey

  useEffect(() => {
    let isMounted = true

    categoriesService
      .getAll({ limit: 200 })
      .then((res) => {
        if (!isMounted) return
        const data = res.data
        const list = data.data ?? data.categories ?? (Array.isArray(data) ? data : [])
        setAllCats(list)
        setError(null)
        setLoadedKey(currentKey)
      })
      .catch((err) => {
        if (!isMounted) return
        setAllCats([])
        setError(err)
        setLoadedKey(currentKey)
      })

    return () => {
      isMounted = false
    }
  }, [retryCount, currentKey])

  const handleSearchChange = (val) => {
    setSearch(val)
    setPage(1)
  }

  const sorted = [...allCats].sort((a, b) =>
    (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' })
  )

  const filtered = search.trim()
    ? sorted.filter(
      (c) =>
        c.title?.toLowerCase().includes(search.toLowerCase()) ||
        (c.description ?? '').toLowerCase().includes(search.toLowerCase())
    )
    : sorted

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / CATS_PER_PAGE))
  const paginated = filtered.slice((page - 1) * CATS_PER_PAGE, page * CATS_PER_PAGE)

  const startEdit = (cat) => {
    setEditingId(cat.id)
    setEditTitle(cat.title)
    setEditDesc(cat.description ?? '')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditTitle('')
    setEditDesc('')
  }

  const handleSaveEdit = async (cat) => {
    if (!editTitle.trim()) return
    setEditLoading(true)
    try {
      await categoriesService.update(cat.id, {
        title: editTitle.trim(),
        description: editDesc.trim(),
      })
      setAllCats((prev) =>
        prev.map((c) =>
          c.id === cat.id
            ? { ...c, title: editTitle.trim(), description: editDesc.trim() }
            : c
        )
      )
      cancelEdit()
      showFlash('Category updated')
    } catch (err) {
      showFlash(err?.message ?? 'Failed to update category', 'error')
    } finally {
      setEditLoading(false)
    }
  }

  const handleDelete = (cat) => {
    setDeleteTargetCat(cat)
  }

  const confirmDeleteCat = async () => {
    if (!deleteTargetCat) return
    setDeleteLoading(true)
    try {
      await categoriesService.delete(deleteTargetCat.id)
      setAllCats((prev) => prev.filter((c) => c.id !== deleteTargetCat.id))
      showFlash('Category deleted')
      setDeleteTargetCat(null)
    } catch (err) {
      showFlash(err?.message ?? 'Failed to delete category', 'error')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleAddSubmit = async (e) => {
    e.preventDefault()
    if (!addTitle.trim()) return
    setAddLoading(true)
    try {
      const res = await categoriesService.create({
        title: addTitle.trim(),
        description: addDesc.trim(),
      })
      const newCat = res.data?.category ?? res.data?.data ?? res.data
      setAllCats((prev) => [...prev, newCat])
      setAddTitle('')
      setAddDesc('')
      setShowAddModal(false)
      showFlash(`Category "${newCat.title || addTitle.trim()}" created`)
    } catch (err) {
      showFlash(err?.message ?? 'Failed to create category', 'error')
    } finally {
      setAddLoading(false)
    }
  }

  function addModal() {
    return (
      <ActionModal
        title="Add Category"
        confirmText="Create Category"
        isLoading={addLoading}
        disabled={!addTitle.trim()}
        onConfirm={handleAddSubmit}
        onClose={() => setShowAddModal(false)}
      >
        <label className={s.formLabel}>
          Title <span className={s.required}>*</span>
          <input
            className={s.input}
            type="text"
            placeholder="e.g. React"
            value={addTitle}
            onChange={(e) => setAddTitle(e.target.value)}
            autoFocus
            required
          />
        </label>
        <label className={s.formLabel}>
          Description
          <input
            className={s.input}
            type="text"
            placeholder="Short description of this category"
            value={addDesc}
            onChange={(e) => setAddDesc(e.target.value)}
          />
        </label>
      </ActionModal>
    )
  }

  function deleteModal() {
    return (
      <ActionModal
        title={`Delete Category: ${deleteTargetCat.title}`}
        message={`Are you sure you want to delete category "${deleteTargetCat.title}"? Posts under this category will no longer be tagged with it.`}
        details={[
          { label: 'Category ID', value: deleteTargetCat.id },
          { label: 'Title', value: deleteTargetCat.title },
        ]}
        confirmText="Delete Category"
        isDanger={true}
        isLoading={deleteLoading}
        onConfirm={confirmDeleteCat}
        onClose={() => setDeleteTargetCat(null)}
      />
    )
  }

  return (
    <div className={s.tabContent}>
      <div className={s.sectionHeader}>
        <div className={s.sectionTitle}>
          <IconFilter size={16} />
          <span>Categories</span>
        </div>
        <span className={s.countBadge}>{total}</span>
      </div>

      <FeedControls
        params={{ search }}
        onChange={(patch) => {
          if (patch.search !== undefined) handleSearchChange(patch.search)
        }}
        placeholder="Search categories by title or description…"
        showFiltersToggle={false}
        showReset={false}
        searchAriaLabel="Search categories"
        rightAction={
          <button
            className={s.btnPrimary}
            type="button"
            onClick={() => setShowAddModal(true)}
            title="Add category"
          >
            <IconPlus size={14} />
            <span className={s.actionBtnLabel}>Add Category</span>
          </button>
        }
      />

      {showAddModal && addModal()}

      {deleteTargetCat && deleteModal()}

      {isLoading && <Loading message="Loading categories…" />}

      {!isLoading && error && (
        <ErrorState
          error={error}
          message="Failed to load categories."
          onRetry={() => setRetryCount((c) => c + 1)}
        />
      )}

      {!isLoading && !error && filtered.length === 0 && (
        <div className={s.feedState}>
          <IconFilter size={32} />
          <p>No categories found{search ? ` matching "${search}"` : ''}</p>
        </div>
      )}

      {!isLoading && !error && paginated.length > 0 && (
        <div className={s.categoryList}>
          {paginated.map((cat) => (
            <div key={cat.id} className={s.categoryRow}>
              <CategoryRow
                cat={cat}
                isEditing={editingId === cat.id}
                editTitle={editTitle}
                editDesc={editDesc}
                editLoading={editLoading}
                onEditTitleChange={setEditTitle}
                onEditDescChange={setEditDesc}
                onSaveEdit={handleSaveEdit}
                onCancelEdit={cancelEdit}
                onStartEdit={startEdit}
                onDelete={handleDelete}
              />
            </div>
          ))}
        </div>
      )}

      {!isLoading && !error && (totalPages > 1 || total > CATS_PER_PAGE) && (
        <div className={s.paginationWrapper}>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={(p) => setPage(p)}
          />
        </div>
      )}
    </div>
  )
}

