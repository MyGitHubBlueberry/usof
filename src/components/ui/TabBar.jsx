import s from './Tabs.module.css'

export default function TabBar({ tabs, activeTab, onTabChange, className = '' }) {
  return (
    <nav className={`${s.tabBar} ${className}`.trim()} role="tablist">
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={activeTab === id}
          className={`${s.tabBtn} ${activeTab === id ? s.tabBtnActive : ''}`}
          onClick={() => onTabChange(id)}
        >
          {Icon && <Icon size={15} />}
          <span>{label}</span>
        </button>
      ))}
    </nav>
  )
}
