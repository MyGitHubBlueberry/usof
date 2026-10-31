import { useCallback } from 'react'
import { postsService } from '../../services/posts.service'
import ProfilePostList from './ProfilePostList'

export default function ProfileFavorites() {
  const fetchFn = useCallback((params) => postsService.getFavorites(params), [])

  return <ProfilePostList fetchFn={fetchFn} emptyMessage="No favorited posts yet." />
}
