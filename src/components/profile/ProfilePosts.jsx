import { useCallback } from 'react'
import { postsService } from '../../services/posts.service'
import ProfilePostList from './ProfilePostList'

export default function ProfilePosts({ profile }) {
  const fetchFn = useCallback(
    (page) =>
      postsService.getAll({
        author: profile.login,
        page,
        limit: 5,
        sortBy: 'publish_date',
        order: 'desc',
      }),
    [profile.login]
  )

  return <ProfilePostList fetchFn={fetchFn} emptyMessage="No posts yet." />
}
