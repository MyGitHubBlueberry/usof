import s from './DataState.module.css'

function resolveStatus(error) {
  return error?.status ?? error?.response?.status ?? error?.raw?.response?.status ?? null
}

export default function ErrorState({
  error,
  title,
  message,
  onRetry,
  retryLabel = 'Retry',
  className = '',
}) {
  const isRateLimited = resolveStatus(error) === 429

  const resolvedTitle = title ?? (isRateLimited ? 'Too many requests' : 'Something went wrong')
  const resolvedMessage = isRateLimited
    ? 'The server is rate-limiting your requests. Wait a moment, then try again.'
    : (message ?? 'Something went wrong. Check your connection and try again.')

  return (
    <div className={`${s.feedState} ${className}`}>
      <p className={s.errorTitle}>{resolvedTitle}</p>
      <p className={s.errorMsg}>{resolvedMessage}</p>
      {onRetry && (
        <button type="button" className={s.retryBtn} onClick={onRetry}>
          {retryLabel}
        </button>
      )}
    </div>
  )
}
