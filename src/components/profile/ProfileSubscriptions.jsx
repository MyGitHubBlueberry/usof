import { useCallback } from 'react'
import { postsService } from '../../services/posts.service'
import ProfilePostList from './ProfilePostList'

export default function ProfileSubscriptions() {
  const fetchFn = useCallback((params) => postsService.getSubscriptions(params), [])

  return <ProfilePostList fetchFn={fetchFn} emptyMessage="No subscribed posts yet." />
}
