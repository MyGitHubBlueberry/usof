import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { postsService } from '../../services/posts.service'
import { ROUTES } from '../../constants/routes'
import ProfilePostList from './ProfilePostList'
import s from './ProfilePosts.module.css'

export default function ProfilePosts({ profile, isOwner }) {
  const fetchFn = useCallback(
    (params) => postsService.getAll({ ...params, author: profile.login }),
    [profile.login]
  )

  const emptyMessage = isOwner ? (
    <>
      <span>No posts yet.</span>
      <Link to={ROUTES.POST_NEW} className={s.createBtn}>
        Create Post
      </Link>
    </>
  ) : (
    'No posts yet.'
  )

  return <ProfilePostList fetchFn={fetchFn} emptyMessage={emptyMessage} />
}
