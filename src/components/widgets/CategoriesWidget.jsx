import { Link } from 'react-router-dom'
import { categoriesService } from '../../services/categories.service'
import { ROUTES } from '../../constants/routes'
import { useAsyncData } from '../../hooks/useAsyncData'
import { IconDocument } from '../ui/Icons'
import SidebarWidget from './SidebarWidget'
import sw from './SidebarWidget.module.css'
import s from './CategoriesWidget.module.css'

export default function CategoriesWidget({ onSelectCategory }) {
  const { data: categories, loading } = useAsyncData(
    () => categoriesService.getAll({ limit: 8 }),
    [],
    []
  )

  return (
    <SidebarWidget
      title="Categories"
      icon={<IconDocument size={14} />}
      loading={loading}
      empty={!loading && categories.length === 0}
      emptyMessage="No categories"
    >
      <ul className={sw.list}>
        {categories.map((cat) => (
          <li key={cat.id}>
            {onSelectCategory ? (
              <button
                type="button"
                className={sw.itemBlock}
                onClick={() => onSelectCategory(cat.title)}
              >
                <div className={s.titleRow}>
                  <span className={s.badge}>{cat.title}</span>
                </div>
                {cat.description && (
                  <span className={s.desc}>{cat.description}</span>
                )}
              </button>
            ) : (
              <Link
                to={`${ROUTES.HOME}?categories=${encodeURIComponent(cat.title)}`}
                className={sw.itemBlock}
              >
                <div className={s.titleRow}>
                  <span className={s.badge}>{cat.title}</span>
                </div>
                {cat.description && (
                  <span className={s.desc}>{cat.description}</span>
                )}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </SidebarWidget>
  )
}
