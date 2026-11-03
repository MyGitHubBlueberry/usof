import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { postsService } from '../services/posts.service'
import { usePostEvents } from '../hooks/usePostEvents'
import { fetchPostDetail, postPatched, likeCountsUpdated } from '../redux/slices/postDetailSlice'
import { likeNetUpdated } from '../redux/slices/commentsSlice'
import { ROUTES } from '../constants/routes'
import { IconXCircle } from '../components/ui/Icons'
import PostHeader from '../components/post-detail/PostHeader'
import PostBody from '../components/post-detail/PostBody'
import PostFooter from '../components/post-detail/PostFooter'
import CommentsSection from '../components/post-detail/CommentsSection'
import NavRow from '../components/ui/NavButtons'
import ErrorState from '../components/ui/ErrorState'
import Loading from '../components/ui/Loading'
import s from './PostDetails.module.css'

function isNotFound(error) {
  const status = error?.status ?? error?.response?.status ?? error?.raw?.response?.status
  return status === 404
}

export default function PostDetails() {
  const { id } = useParams()
  const dispatch = useDispatch()
  const currentUser = useSelector((state) => state.auth.user)
  const { post, author, categories, status, error } = useSelector((state) => state.postDetail)
  const loading = status === 'idle' || status === 'pending'

  const [isFavorited, setIsFavorited] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [commentsRefreshToken, setCommentsRefreshToken] = useState(0)

  useEffect(() => {
    dispatch(fetchPostDetail(id))
  }, [dispatch, id])

  useEffect(() => {
    let isMounted = true

    const task = currentUser
      ? Promise.all([
          postsService.getFavorites({ limit: 100 }).catch(() => null),
          postsService.getSubscriptions({ limit: 100 }).catch(() => null),
        ])
      : Promise.resolve([null, null])

    task.then(([favoritesRes, subscriptionsRes]) => {
      if (!isMounted) return
      const favs = favoritesRes?.data?.data ?? []
      setIsFavorited(favs.some((p) => Number(p.id) === Number(id)))
      const subs = subscriptionsRes?.data?.data ?? []
      setIsSubscribed(subs.some((p) => Number(p.id) === Number(id)))
    })

    return () => {
      isMounted = false
    }
  }, [id, currentUser])

  const handleRetry = () => dispatch(fetchPostDetail(id))

  usePostEvents(post?.id, {
    likes_updated: (counts) => {
      if (!counts) return
      dispatch(likeCountsUpdated({ likes: counts.likes, dislikes: counts.dislikes }))
    },
    post_updated: (updated) => {
      if (!updated) return
      dispatch(postPatched(updated))
    },
    comments_updated: () => {
      setCommentsRefreshToken((v) => v + 1)
    },
    comment_like_updated: (payload) => {
      if (!payload) return
      dispatch(
        likeNetUpdated({ commentId: payload.commentId, likes: payload.likes ?? 0, dislikes: payload.dislikes ?? 0 })
      )
    },
  })

  if (loading) {
    return <Loading message="Loading post…" size="large" />
  }

  if (isNotFound(error)) {
    return (
      <div className={s.notFoundState}>
        <IconXCircle size={48} className={s.notFoundIcon} />
        <h1 className={s.notFoundTitle}>Post not found</h1>
        <p className={s.notFoundMsg}>
          This post doesn't exist, or it may have been removed.
        </p>
        <Link to={ROUTES.HOME} className={s.notFoundLink}>
          Back to the feed
        </Link>
      </div>
    )
  }

  if (error || !post) {
    return <ErrorState error={error} message="Could not load this post." onRetry={handleRetry} />
  }

  return (
    <>
      <NavRow />
      <div className={s.postPage}>
        <PostHeader
          categories={categories}
          isFavorited={isFavorited}
          onFavoriteChange={setIsFavorited}
          onRequireCommentsRefresh={() => setCommentsRefreshToken((v) => v + 1)}
        />
        <PostBody post={post} />
        <PostFooter
          author={author}
          isSubscribed={isSubscribed}
          onSubscribeChange={setIsSubscribed}
        />
        <CommentsSection
          postId={post.id}
          refreshToken={commentsRefreshToken}
        />
      </div>
    </>
  )
}
