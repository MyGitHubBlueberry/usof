import { useCollapsible } from '../../hooks/useCollapsible'
import { IconChevron } from './Icons'
import s from './ExpandableContent.module.css'

export default function ExpandableContent({
  children,
  maxHeight,
  lineClamp,
  watchKey,
  className = '',
  collapsedClassName,
  toggleClassName,
  showChevron = true,
  showMoreLabel = 'Show more',
  showLessLabel = 'Show less',
}) {
  const { ref, collapsed, canExpand, toggle } = useCollapsible({ maxHeight, lineClamp, watchKey })

  return (
    <>
      <div
        ref={ref}
        className={`${className} ${collapsed && canExpand ? collapsedClassName ?? s.collapsed : ''}`}
      >
        {children}
      </div>

      {canExpand && (
        <button type="button" className={toggleClassName ?? s.showMoreBtn} onClick={toggle}>
          <span>{collapsed ? showMoreLabel : showLessLabel}</span>
          {showChevron && <IconChevron up={!collapsed} size={12} />}
        </button>
      )}
    </>
  )
}
