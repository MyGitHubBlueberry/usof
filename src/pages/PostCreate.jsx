import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { postsService } from '../services/posts.service'
import { categoriesService } from '../services/categories.service'
import { useFlash } from '../hooks/useFlash'
import { ROUTES, toPost } from '../constants/routes'
import PostCreateHeader from '../components/post-create/PostCreateHeader'
import MarkdownEditor from '../components/post-create/MarkdownEditor'
import AttachmentUploader from '../components/post-create/AttachmentUploader'
import NavRow from '../components/ui/NavButtons'
import s from './PostCreate.module.css'

const DRAFT_KEY = 'usof_post_create_draft'

function validate({ title, content }) {
  const e = {}
  if (!title.trim()) e.title = 'Title is required.'
  if (!content.trim()) e.content = 'Content is required.'
  return e
}

function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function PostCreateForm() {
  const navigate = useNavigate()
  const { showFlash } = useFlash()

  const [initialDraft] = useState(loadDraft)
  const [title, setTitle] = useState(initialDraft?.title || '')
  const [content, setContent] = useState(initialDraft?.content || '')
  const [selectedCategories, setSelectedCategories] = useState(
    Array.isArray(initialDraft?.categories) ? initialDraft.categories : []
  )
  const [categoryOptions, setCategoryOptions] = useState([])
  const [attachments, setAttachments] = useState([])
  const [touched, setTouched] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    categoriesService
      .getAll({ limit: 100 })
      .then((res) => {
        const cats = res.data?.data ?? []
        setCategoryOptions(cats.map((c) => ({ value: c.title, label: c.title, description: c.description || '' })))
      })
      .catch(() => setCategoryOptions([]))
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ title, content, categories: selectedCategories }))
    } catch {
      // storage unavailable, autosave skipped
    }
  }, [title, content, selectedCategories])

  function clearDraft() {
    localStorage.removeItem(DRAFT_KEY)
  }

  const errors = touched ? validate({ title, content }) : {}

  function handleSubmit() {
    setTouched(true)
    if (Object.keys(validate({ title, content })).length || submitting) return

    const formData = new FormData()
    formData.append('title', title.trim())
    formData.append('content', content)
    selectedCategories.forEach((category) => formData.append('categories[]', category))
    attachments.forEach((file) => formData.append('attachments', file))

    setSubmitting(true)
    postsService
      .create(formData)
      .then((res) => {
        clearDraft()
        showFlash('Post created.', 'success')
        navigate(toPost(res.data.id), { replace: true })
      })
      .catch((err) => {
        showFlash(err.message || 'Could not create post.', 'error')
        setSubmitting(false)
      })
  }

  function handleKeyDown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <>
      <NavRow />
      <div className={s.postPage} onKeyDown={handleKeyDown}>
        <PostCreateHeader
          mode="create"
          title={title}
          onTitleChange={setTitle}
          titleError={errors.title}
          selectedCategories={selectedCategories}
          categoryOptions={categoryOptions}
          onCategoriesChange={setSelectedCategories}
        />

        <MarkdownEditor value={content} onChange={setContent} error={errors.content} />

        <AttachmentUploader files={attachments} onChange={setAttachments} />

        <div className={s.actions}>
          <Link to={ROUTES.HOME} className={s.cancelBtn} onClick={clearDraft}>
            Cancel
          </Link>
          <button type="button" className={s.submitBtn} onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Publishing…' : 'Publish post'}
          </button>
        </div>
      </div>
    </>
  )
}

export default function PostCreate() {
  const currentUser = useSelector((state) => state.auth.user)

  if (!currentUser) {
    return (
      <div className={s.stateMsg}>
        <p>
          <Link to={ROUTES.LOGIN}>Sign in</Link> to create a post.
        </p>
      </div>
    )
  }

  return <PostCreateForm />
}
