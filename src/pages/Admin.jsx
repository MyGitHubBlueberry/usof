import { useState } from 'react'
import { useSelector } from 'react-redux'
import CategoriesTab from './AdminPanelCategoriesTab'
import UsersTab from './AdminPanelUsersTab'
import PostsTab from './AdminPanelPostsTab'
import { FlashProvider } from '../context/FlashProvider'
import TabBar from '../components/ui/TabBar'
import {
  IconShield,
  IconUser,
  IconDocument,
  IconFilter,
} from '../components/ui/Icons'
import s from './Admin.module.css'

const TABS = [
  { id: 'users', label: 'Users', icon: IconUser },
  { id: 'posts', label: 'Posts', icon: IconDocument },
  { id: 'categories', label: 'Categories', icon: IconFilter },
]

export default function Admin() {
  const user = useSelector((state) => state.auth.user)
  const [activeTab, setActiveTab] = useState('users')

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin'

  if (!isAdmin) {
    return (
      <div className={s.accessDenied}>
        <div className={s.accessDeniedIcon}>
          <IconShield size={48} />
        </div>
        <h2 className={s.accessDeniedCode}>403</h2>
        <h3 className={s.accessDeniedTitle}>Access Denied</h3>
        <p className={s.accessDeniedMsg}>
          You don&apos;t have permission to view this page. Admin or superadmin role is required.
        </p>
      </div>
    )
  }

  return (
    <FlashProvider>
      <div className={s.adminPage}>
        <div className={s.adminHeader}>
          <div className={s.adminHeaderInner}>
            <IconShield size={18} />
            <h1 className={s.adminTitle}>Admin Panel</h1>
            {user?.role === 'superadmin' && (
              <span className={s.superadminBadge}>Superadmin</span>
            )}
          </div>
        </div>

        <TabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} className={s.tabBar} />

        <div className={s.tabPanel} role="tabpanel">
          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'posts' && <PostsTab />}
          {activeTab === 'categories' && <CategoriesTab />}
        </div>
      </div>
    </FlashProvider>
  )
}
