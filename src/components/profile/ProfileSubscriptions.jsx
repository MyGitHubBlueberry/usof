import { useCallback } from 'react'
import { postsService } from '../../services/posts.service'
import ProfilePostList from './ProfilePostList'

export default function ProfileSubscriptions() {
  const fetchFn = useCallback((page) => postsService.getSubscriptions({ page, limit: 5 }), [])

  return <ProfilePostList fetchFn={fetchFn} emptyMessage="No subscribed posts yet." />
}
