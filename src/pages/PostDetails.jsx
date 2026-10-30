import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { postsService } from '../services/posts.service'
import { usersService } from '../services/users.service'
import { FlashProvider } from '../context/FlashProvider'
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
  const [likeCounts, setLikeCounts] = useState({ likes: 0, dislikes: 0 })
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
          postsService.getLikes(id).catch(() => ({ data: { likes: 0, dislikes: 0 } })),
          currentUser ? postsService.getFavorites({ limit: 100 }).catch(() => null) : Promise.resolve(null),
          currentUser ? postsService.getSubscriptions({ limit: 100 }).catch(() => null) : Promise.resolve(null),
        ]

        return Promise.all(tasks).then(
          ([authorRes, categoriesRes, likesRes, favoritesRes, subscriptionsRes]) => {
            if (!isMounted) return
            setAuthor(authorRes?.data ?? null)
            setCategories(categoriesRes.data ?? [])
            setLikeCounts(likesRes.data ?? { likes: 0, dislikes: 0 })

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
      <div className={s.stateMsg}>
        <p>This post could not be found.</p>
      </div>
    )
  }

  return (
    <FlashProvider>
      <div className={s.postPage}>
        <PostHeader
          post={post}
          categories={categories}
          isAuthenticated={!!currentUser}
          isFavorited={isFavorited}
          isSubscribed={isSubscribed}
          isAdmin={isAdmin}
          currentUser={currentUser}
          onFavoriteChange={setIsFavorited}
          onSubscribeChange={setIsSubscribed}
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
          onLikeCountsChange={setLikeCounts}
        />
        <CommentsSection
          postId={post.id}
          postStatus={post.status}
          isAdmin={isAdmin}
          currentUser={currentUser}
          refreshToken={commentsRefreshToken}
          onPostStatusChange={(status) => setPost((prev) => (prev ? { ...prev, status } : prev))}
        />
      </div>
    </FlashProvider>
  )
}
