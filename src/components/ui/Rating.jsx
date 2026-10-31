import { IconThumbsUp, IconThumbsDown } from './Icons'
import s from './Rating.module.css'

export default function Rating({ counts, myReaction, onReact, disabled, size = 'md' }) {
  const net = (counts.likes ?? 0) - (counts.dislikes ?? 0)
  const iconSize = size === 'sm' ? 13 : 15

  return (
    <div className={`${s.rating} ${s[size]}`}>
      <button
        type="button"
        className={`${s.reactBtn} ${myReaction === 'like' ? s.reactBtnActive : ''}`}
        onClick={() => onReact('like')}
        disabled={disabled}
        aria-label="Like"
        title="Like"
      >
        <IconThumbsUp size={iconSize} filled={myReaction === 'like'} />
      </button>
      <span className={s.ratingCount}>{net}</span>
      <button
        type="button"
        className={`${s.reactBtn} ${myReaction === 'dislike' ? s.reactBtnActive : ''}`}
        onClick={() => onReact('dislike')}
        disabled={disabled}
        aria-label="Dislike"
        title="Dislike"
      >
        <IconThumbsDown size={iconSize} filled={myReaction === 'dislike'} />
      </button>
    </div>
  )
}
