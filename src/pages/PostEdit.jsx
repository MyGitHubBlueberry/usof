import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { postsService } from '../services/posts.service'
import { categoriesService } from '../services/categories.service'
import { useFlash } from '../hooks/useFlash'
import { FlashProvider } from '../context/FlashProvider'
import { ROUTES, toPost } from '../constants/routes'
import { getDisplayName } from '../utils/attachments'
import PostCreateHeader from '../components/post-create/PostCreateHeader'
import MarkdownEditor from '../components/post-create/MarkdownEditor'
import AttachmentUploader from '../components/post-create/AttachmentUploader'
import s from './PostCreate.module.css'

function validate({ title, content }) {
  const e = {}
  if (!title.trim()) e.title = 'Title is required.'
  if (!content.trim()) e.content = 'Content is required.'
  return e
}

function PostEditForm({ post, categories }) {
  const navigate = useNavigate()
  const { showFlash } = useFlash()

  const [title, setTitle] = useState(post.title)
  const [content, setContent] = useState(post.content)
  const [selectedCategories, setSelectedCategories] = useState(categories.map((c) => c.title))
  const [categoryOptions, setCategoryOptions] = useState([])
  const [newAttachments, setNewAttachments] = useState([])
  const [touched, setTouched] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    categoriesService
      .getAll({ limit: 100 })
      .then((res) => {
        const cats = res.data?.data ?? []
        setCategoryOptions(cats.map((c) => ({ value: c.title, label: c.title })))
      })
      .catch(() => setCategoryOptions([]))
  }, [])

  const errors = touched ? validate({ title, content }) : {}

  function handleSubmit() {
    setTouched(true)
    if (Object.keys(validate({ title, content })).length || submitting) return

    const formData = new FormData()
    formData.append('title', title.trim())
    formData.append('content', content)
    selectedCategories.forEach((category) => formData.append('categories[]', category))
    newAttachments.forEach((file) => formData.append('attachments', file))

    setSubmitting(true)
    postsService
      .update(post.id, formData)
      .then(() => {
        showFlash('Post updated.', 'success')
        navigate(toPost(post.id))
      })
      .catch((err) => {
        showFlash(err.message || 'Could not update post.', 'error')
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
    <div className={s.postPage} onKeyDown={handleKeyDown}>
      <h1 className={s.pageTitle}>Edit post</h1>

      {post.status === 'inactive' && (
        <p className={s.inactiveNotice}>
          This post is currently hidden by a moderator. Save your changes to resubmit it for review.
        </p>
      )}

      <PostCreateHeader
        title={title}
        onTitleChange={setTitle}
        titleError={errors.title}
        selectedCategories={selectedCategories}
        categoryOptions={categoryOptions}
        onCategoriesChange={setSelectedCategories}
      />

      <MarkdownEditor value={content} onChange={setContent} error={errors.content} />

      {post.attachments?.length > 0 && (
        <div className={s.existingAttachments}>
          <span className={s.existingAttachmentsLabel}>Existing attachments</span>
          <div className={s.existingAttachmentsList}>
            {post.attachments.map((filename) => (
              <span key={filename} className={s.existingAttachmentItem}>
                {getDisplayName(filename)}
              </span>
            ))}
          </div>
        </div>
      )}

      <AttachmentUploader files={newAttachments} onChange={setNewAttachments} />

      <div className={s.actions}>
        <Link to={toPost(post.id)} className={s.cancelBtn}>
          Cancel
        </Link>
        <button type="button" className={s.submitBtn} onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}

export default function PostEdit() {
  const { id } = useParams()
  const currentUser = useSelector((state) => state.auth.user)

  const [post, setPost] = useState(null)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const loadPost = useCallback(() => {
    let isMounted = true
    setLoading(true)
    setNotFound(false)

    postsService
      .getById(id)
      .then((res) => {
        if (!isMounted) return
        setPost(res.data)
        return postsService.getCategories(id).catch(() => ({ data: [] }))
      })
      .then((categoriesRes) => {
        if (!isMounted || !categoriesRes) return
        setCategories(categoriesRes.data ?? [])
      })
      .catch(() => {
        if (isMounted) setNotFound(true)
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [id])

  useEffect(() => loadPost(), [loadPost])

  if (loading) {
    return <div className={s.stateMsg}>Loading post…</div>
  }

  if (notFound || !post) {
    return (
      <div className={s.stateMsg}>
        <p>
          Post not found. <Link to={ROUTES.HOME}>Back to the feed</Link>
        </p>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className={s.stateMsg}>
        <p>
          <Link to={ROUTES.LOGIN}>Sign in</Link> to edit this post.
        </p>
      </div>
    )
  }

  const isOwner = Number(currentUser.id) === Number(post.user_id)

  if (!isOwner) {
    return (
      <div className={s.stateMsg}>
        <p>
          You can only edit your own posts. <Link to={toPost(post.id)}>Back to post</Link>
        </p>
      </div>
    )
  }

  if (post.status === 'resolved') {
    return (
      <div className={s.stateMsg}>
        <p>
          This post is resolved and can no longer be edited. <Link to={toPost(post.id)}>Back to post</Link>
        </p>
      </div>
    )
  }

  return (
    <FlashProvider>
      <PostEditForm post={post} categories={categories} />
    </FlashProvider>
  )
}
