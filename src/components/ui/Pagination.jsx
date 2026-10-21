import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
} from './Icons.jsx'
import s from './Pagination.module.css'

function generatePaginationRange(currentPage, totalPages, siblingCount = 1) {
  const totalNumbers = siblingCount * 2 + 5

  if (totalPages <= totalNumbers) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const leftSibling = Math.max(currentPage - siblingCount, 1)
  const rightSibling = Math.min(currentPage + siblingCount, totalPages)

  const shouldShowLeftDots = leftSibling > 2
  const shouldShowRightDots = rightSibling < totalPages - 1

  if (!shouldShowLeftDots && shouldShowRightDots) {
    const leftItemCount = 3 + 2 * siblingCount
    const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1)
    return [...leftRange, 'DOTS-RIGHT', totalPages]
  }

  if (shouldShowLeftDots && !shouldShowRightDots) {
    const rightItemCount = 3 + 2 * siblingCount
    const rightRange = Array.from(
      { length: rightItemCount },
      (_, i) => totalPages - rightItemCount + 1 + i
    )
    return [1, 'DOTS-LEFT', ...rightRange]
  }

  const middleRange = Array.from(
    { length: rightSibling - leftSibling + 1 },
    (_, i) => leftSibling + i
  )
  return [1, 'DOTS-LEFT', ...middleRange, 'DOTS-RIGHT', totalPages]
}

export default function Pagination({
  page = 1,
  currentPage,
  totalPages = 1,
  onPageChange,
  siblingCount = 1,
  showFirstLast = true,
  disabled = false,
  hideOnSinglePage = false,
  className = '',
}) {
  const activePage = currentPage ?? page

  if (!totalPages || totalPages < 1) {
    return null
  }

  if (hideOnSinglePage && totalPages <= 1) {
    return null
  }

  const clampedPage = Math.min(Math.max(1, activePage), totalPages)
  const pages = generatePaginationRange(clampedPage, totalPages, siblingCount)

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === clampedPage || disabled) {
      return
    }
    onPageChange?.(newPage)
  }

  return (
    <nav
      className={`${s.pagination} ${className}`.trim()}
      aria-label="Pagination navigation"
    >
      {showFirstLast && (
        <button
          type="button"
          className={`${s.btn} ${s.navBtn}`}
          onClick={() => handlePageChange(1)}
          disabled={clampedPage <= 1 || disabled}
          aria-label="First page"
          title="First page"
        >
          <IconChevronsLeft size={16} />
        </button>
      )}

      <button
        type="button"
        className={`${s.btn} ${s.navBtn}`}
        onClick={() => handlePageChange(clampedPage - 1)}
        disabled={clampedPage <= 1 || disabled}
        aria-label="Previous page"
        title="Previous page"
      >
        <IconChevronLeft size={16} />
      </button>

      {pages.map((item, index) => {
        if (typeof item === 'string') {
          return (
            <span
              key={`${item}-${index}`}
              className={s.ellipsis}
              aria-hidden="true"
            >
              &hellip;
            </span>
          )
        }

        const isActive = item === clampedPage

        return (
          <button
            key={item}
            type="button"
            className={`${s.btn} ${isActive ? s.active : ''}`}
            onClick={() => handlePageChange(item)}
            disabled={disabled}
            aria-current={isActive ? 'page' : undefined}
            aria-label={`Page ${item}`}
            title={`Page ${item}`}
          >
            {item}
          </button>
        )
      })}

      <button
        type="button"
        className={`${s.btn} ${s.navBtn}`}
        onClick={() => handlePageChange(clampedPage + 1)}
        disabled={clampedPage >= totalPages || disabled}
        aria-label="Next page"
        title="Next page"
      >
        <IconChevronRight size={16} />
      </button>

      {showFirstLast && (
        <button
          type="button"
          className={`${s.btn} ${s.navBtn}`}
          onClick={() => handlePageChange(totalPages)}
          disabled={clampedPage >= totalPages || disabled}
          aria-label="Last page"
          title="Last page"
        >
          <IconChevronsRight size={16} />
        </button>
      )}
    </nav>
  )
}
