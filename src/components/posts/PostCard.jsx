import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import ReactMarkdown from 'react-markdown'
import { toPost, toProfile } from '../../constants/routes'
import { postsService } from '../../services/posts.service'
import { useFlash } from '../../hooks/useFlash'
import { formatFullDate } from '../../utils/format'
import { MARKDOWN_PLUGINS, MARKDOWN_COMPONENTS } from '../../utils/markdown'
import { IMAGE_EXTENSIONS, getExtension, getAttachmentUrl } from '../../utils/attachments'
import FavoriteButton from '../ui/FavoriteButton'
import { IconMessageCircle, IconPaperclip, IconThumbsUp, IconShare, IconCheck } from '../ui/Icons'
import s from './PostCard.module.css'

export default function PostCard({ post }) {
  const navigate = useNavigate()
  const currentUser = useSelector((state) => state.auth.user)
  const { showFlash } = useFlash()
  const [likes, setLikes] = useState(null)
  const [favorited, setFavorited] = useState(!!post?.is_favorited)
  const [shared, setShared] = useState(false)
  const [previewSrc, setPreviewSrc] = useState(null)

  useEffect(() => {
    if (!post?.id || post.like_count !== undefined) return
    let isMounted = true
    postsService
      .getLikes(post.id)
      .then((res) => {
        if (!isMounted) return
        setLikes((res.data?.likes ?? 0) - (res.data?.dislikes ?? 0))
      })
      .catch(() => {
        if (!isMounted) return
        setLikes(0)
      })
    return () => {
      isMounted = false
    }
  }, [post?.id, post?.like_count])

  useEffect(() => {
    if (!post?.id || !post?.attachment_count) return
    let isMounted = true
    // The feed list endpoint only returns attachment_count, not filenames, so
    // finding the first image means fetching the full post. This adds one
    // extra request per card that has attachments — acceptable since feeds
    // are paginated to a handful of posts per page.
    postsService
      .getById(post.id)
      .then((res) => {
        if (!isMounted) return
        const attachments = res.data?.attachments ?? []
        const firstImage = attachments.find((f) => IMAGE_EXTENSIONS.includes(getExtension(f)))
        if (firstImage) setPreviewSrc(getAttachmentUrl(post.id, firstImage))
      })
      .catch(() => { })
    return () => {
      isMounted = false
    }
  }, [post?.id, post?.attachment_count])

  const categories = useMemo(
    () =>
      post?.category_titles
        ? post.category_titles.split(',').map((c) => c.trim()).filter(Boolean)
        : [],
    [post]
  )

  if (!post) return null

  const displayLikes =
    post.like_count !== undefined ? Number(post.like_count) : (likes ?? 0)

  // comment_count is a snapshot from the list response and isn't polled live;
  // it only refreshes when the feed itself refetches (page/filter change).
  const commentCount = Number(post.comment_count ?? 0)
  const attachmentCount = Number(post.attachment_count ?? 0)
  const showStatusBadge = post.status === 'resolved' || post.status === 'inactive'

  const statusClass = post.status === 'resolved' ? s.statusResolved : s.statusInactive

  function handleCardClick() {
    navigate(toPost(post.id))
  }

  function handleCardKeyDown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      navigate(toPost(post.id))
    }
  }

  function handleShare(e) {
    e.preventDefault()
    e.stopPropagation()

    const url = `${window.location.origin}${toPost(post.id)}`
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setShared(true)
        showFlash('Link copied to clipboard.', 'success')
        setTimeout(() => setShared(false), 1500)
      })
      .catch(() => showFlash('Could not copy link.', 'error'))
  }

  return (
    <article
      className={`${s.postCard} ${previewSrc ? s.postCardWithPreview : ''}`}
      role="link"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
    >
      {previewSrc && (
        <div className={s.cardPreviewWrapper}>
          <div className={s.cardPreview}>
            <img
              src={previewSrc}
              alt=""
              aria-hidden="true"
              className={s.cardPreviewImg}
              onError={() => setPreviewSrc(null)}
            />
          </div>
        </div>
      )}

      <div className={s.cardBody}>
        <div className={s.postHeader}>
          <FavoriteButton
            postId={post.id}
            isFavorited={favorited}
            isAuthenticated={!!currentUser}
            onChange={setFavorited}
            size={18}
            className={s.cardFavoriteBtn}
          />

          <div className={s.titleGroup}>
            <h2 className={s.postTitle}>{post.title}</h2>
            {categories.length > 0 && (
              <div className={s.categoryRow}>
                {categories.map((title) => (
                  <span key={title} className={s.categoryTag}>
                    {title}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className={s.headerActions}>
            {showStatusBadge && (
              <span className={`${s.statusBadge} ${statusClass}`}>
                {post.status}
              </span>
            )}
            <button
              type="button"
              className={s.shareBtn}
              onClick={handleShare}
              aria-label="Copy post link"
              title={shared ? 'Copied!' : 'Share'}
            >
              {shared ? <IconCheck size={15} /> : <IconShare size={15} />}
            </button>
          </div>
        </div>

        {post.content && (
          <div className={s.postSnippet}>
            <ReactMarkdown remarkPlugins={MARKDOWN_PLUGINS} components={MARKDOWN_COMPONENTS}>
              {post.content}
            </ReactMarkdown>
          </div>
        )}

        <div className={s.postFooter}>
          <div className={s.metaGroup}>
            <span className={s.metricItem} title="Likes">
              <IconThumbsUp size={13} />
              {displayLikes}
            </span>
            <span className={s.metricItem} title="Comments">
              <IconMessageCircle size={13} />
              {commentCount}
            </span>
            {attachmentCount > 0 && (
              <span className={s.metricItem} title="Attachments">
                <IconPaperclip size={13} />
                {attachmentCount}
              </span>
            )}
          </div>

          <div className={s.authorMeta}>
            {post.author_login && (
              <span>
                By{' '}
                <Link
                  to={toProfile(post.user_id)}
                  className={s.authorLink}
                  onClick={(e) => e.stopPropagation()}
                >
                  {post.author_login}
                </Link>
              </span>
            )}
            {post.publish_date && <span>On {formatFullDate(post.publish_date)}</span>}
          </div>
        </div>
      </div>
    </article>
  )
}
