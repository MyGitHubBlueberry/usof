import { useMemo } from 'react'
import { IconDocument, IconStar, IconBell, IconRss } from '../ui/Icons'
import TabBar from '../ui/TabBar'
import ProfilePosts from './ProfilePosts'
import ProfileFavorites from './ProfileFavorites'
import ProfileNotifications from './ProfileNotifications'
import ProfileSubscriptions from './ProfileSubscriptions'
import s from './ProfileTabs.module.css'

const ALL_TABS = [
  { id: 'posts', label: 'Posts', icon: IconDocument, ownerOnly: false },
  { id: 'favorites', label: 'Favorites', icon: IconStar, ownerOnly: true },
  { id: 'notifications', label: 'Notifications', icon: IconBell, ownerOnly: true },
  { id: 'subscriptions', label: 'Subscriptions', icon: IconRss, ownerOnly: true },
]

export default function ProfileTabs({ profile, isOwner, activeTab, onTabChange }) {
  const tabs = useMemo(
    () =>
      ALL_TABS.filter((tab) => !tab.ownerOnly || isOwner).map((tab) =>
        tab.id === 'posts' && isOwner ? { ...tab, label: 'My Posts' } : tab
      ),
    [isOwner]
  )
  const effectiveTab = tabs.some((tab) => tab.id === activeTab) ? activeTab : 'posts'

  return (
    <div className={s.tabsWrap}>
      <TabBar tabs={tabs} activeTab={effectiveTab} onTabChange={onTabChange} className={s.tabBar} />

      <div className={s.tabPanel} role="tabpanel">
        {effectiveTab === 'posts' && <ProfilePosts profile={profile} />}
        {effectiveTab === 'favorites' && isOwner && <ProfileFavorites />}
        {effectiveTab === 'notifications' && isOwner && <ProfileNotifications />}
        {effectiveTab === 'subscriptions' && isOwner && <ProfileSubscriptions />}
      </div>
    </div>
  )
}
