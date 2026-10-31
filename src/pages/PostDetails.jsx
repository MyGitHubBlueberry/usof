import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { postsService } from '../services/posts.service'
import { usersService } from '../services/users.service'
import { FlashProvider } from '../context/FlashProvider'
import { ROUTES } from '../constants/routes'
import { IconXCircle } from '../components/ui/Icons'
import BackButton from '../components/ui/BackButton'
import PostHeader from '../components/post-detail/PostHeader'
import PostBody from '../components/post-detail/PostBody'
import PostFooter from '../components/post-detail/PostFooter'
import CommentsSection from '../components/post-detail/CommentsSection'
import s from './PostDetails.module.css'

export default function PostDetails() {
  const { id } = useParams()
  const currentUser = useSelector((state) => state.auth.user)
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin'

  const [post, setPost] = useState(null)
  const [author, setAuthor] = useState(null)
  const [categories, setCategories] = useState([])
  const [likeCounts, setLikeCounts] = useState({ likes: 0, dislikes: 0, myReaction: null })
  const [isFavorited, setIsFavorited] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [commentsRefreshToken, setCommentsRefreshToken] = useState(0)

  const loadPost = useCallback(() => {
    let isMounted = true
    setLoading(true)
    setNotFound(false)

    postsService
      .getById(id)
      .then((res) => {
        if (!isMounted) return
        const data = res.data
        setPost(data)

        const tasks = [
          usersService.getById(data.user_id).catch(() => null),
          postsService.getCategories(id).catch(() => ({ data: [] })),
          postsService.getLikes(id).catch(() => ({ data: { likes: 0, dislikes: 0, myReaction: null } })),
          currentUser ? postsService.getFavorites({ limit: 100 }).catch(() => null) : Promise.resolve(null),
          currentUser ? postsService.getSubscriptions({ limit: 100 }).catch(() => null) : Promise.resolve(null),
        ]

        return Promise.all(tasks).then(
          ([authorRes, categoriesRes, likesRes, favoritesRes, subscriptionsRes]) => {
            if (!isMounted) return
            setAuthor(authorRes?.data ?? null)
            setCategories(categoriesRes.data ?? [])
            setLikeCounts(likesRes.data ?? { likes: 0, dislikes: 0, myReaction: null })

            if (favoritesRes) {
              const favs = favoritesRes.data?.data ?? []
              setIsFavorited(favs.some((p) => Number(p.id) === Number(id)))
            } else {
              setIsFavorited(false)
            }

            if (subscriptionsRes) {
              const subs = subscriptionsRes.data?.data ?? []
              setIsSubscribed(subs.some((p) => Number(p.id) === Number(id)))
            } else {
              setIsSubscribed(false)
            }
          }
        )
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
  }, [id, currentUser])

  useEffect(() => loadPost(), [loadPost])

  if (loading) {
    return <div className={s.stateMsg}>Loading post…</div>
  }

  if (notFound || !post) {
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

  return (
    <FlashProvider>
      <div className={s.postPage}>
        <BackButton />
        <PostHeader
          post={post}
          categories={categories}
          isAuthenticated={!!currentUser}
          isFavorited={isFavorited}
          isAdmin={isAdmin}
          currentUser={currentUser}
          onFavoriteChange={setIsFavorited}
          onStatusChange={(status) => setPost((prev) => (prev ? { ...prev, status } : prev))}
          onRequireCommentsRefresh={() => setCommentsRefreshToken((v) => v + 1)}
        />
        <PostBody post={post} />
        <PostFooter
          post={post}
          author={author}
          likeCounts={likeCounts}
          isAuthenticated={!!currentUser}
          isAdmin={isAdmin}
          isSubscribed={isSubscribed}
          onLikeCountsChange={setLikeCounts}
          onSubscribeChange={setIsSubscribed}
        />
        <CommentsSection
          postId={post.id}
          postStatus={post.status}
          postAuthorId={post.user_id}
          isAdmin={isAdmin}
          currentUser={currentUser}
          refreshToken={commentsRefreshToken}
          onPostStatusChange={(status) => setPost((prev) => (prev ? { ...prev, status } : prev))}
        />
      </div>
    </FlashProvider>
  )
}
