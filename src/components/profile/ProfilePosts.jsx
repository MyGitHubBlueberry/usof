import { useCallback } from 'react'
import { postsService } from '../../services/posts.service'
import ProfilePostList from './ProfilePostList'

export default function ProfilePosts({ profile }) {
  const fetchFn = useCallback(
    (params) => postsService.getAll({ ...params, author: profile.login }),
    [profile.login]
  )

  return <ProfilePostList fetchFn={fetchFn} emptyMessage="No posts yet." />
}
