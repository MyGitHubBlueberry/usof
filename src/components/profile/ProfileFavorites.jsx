import { useCallback } from 'react'
import { postsService } from '../../services/posts.service'
import ProfilePostList from './ProfilePostList'

export default function ProfileFavorites() {
  const fetchFn = useCallback((page) => postsService.getFavorites({ page, limit: 5 }), [])

  return <ProfilePostList fetchFn={fetchFn} emptyMessage="No favorited posts yet." />
}
