import { useCallback, useEffect, useState } from 'react'
import { IconX, IconChevronLeft, IconChevronRight, IconZoomIn, IconZoomOut } from './Icons'
import s from './Lightbox.module.css'

const ZOOM_LEVELS = [1, 1.5, 2, 2.5, 3]

export default function Lightbox({ images, startIndex = 0, onClose }) {
  const [index, setIndex] = useState(startIndex)
  const [zoomStep, setZoomStep] = useState(0)

  const count = images.length
  const current = images[index]

  const goPrev = useCallback(() => {
    setZoomStep(0)
    setIndex((prev) => (prev - 1 + count) % count)
  }, [count])

  const goNext = useCallback(() => {
    setZoomStep(0)
    setIndex((prev) => (prev + 1) % count)
  }, [count])

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && count > 1) goPrev()
      if (e.key === 'ArrowRight' && count > 1) goNext()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose, goPrev, goNext, count])

  if (!current) return null

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onClose()
  }

  function zoomIn() {
    setZoomStep((v) => Math.min(v + 1, ZOOM_LEVELS.length - 1))
  }

  function zoomOut() {
    setZoomStep((v) => Math.max(v - 1, 0))
  }

  return (
    <div className={s.overlay} onClick={handleOverlayClick}>
      <button type="button" className={s.closeBtn} onClick={onClose} aria-label="Close preview">
        <IconX size={18} />
      </button>

      <div className={s.zoomControls}>
        <button type="button" className={s.ctrlBtn} onClick={zoomOut} disabled={zoomStep === 0} aria-label="Zoom out">
          <IconZoomOut size={16} />
        </button>
        <span className={s.zoomLevel}>{Math.round(ZOOM_LEVELS[zoomStep] * 100)}%</span>
        <button
          type="button"
          className={s.ctrlBtn}
          onClick={zoomIn}
          disabled={zoomStep === ZOOM_LEVELS.length - 1}
          aria-label="Zoom in"
        >
          <IconZoomIn size={16} />
        </button>
      </div>

      {count > 1 && (
        <button type="button" className={`${s.navBtn} ${s.navPrev}`} onClick={goPrev} aria-label="Previous image">
          <IconChevronLeft size={22} />
        </button>
      )}

      <div className={s.viewport}>
        <img
          key={current.src}
          src={current.src}
          alt={current.alt}
          className={`${s.image} ${s[`zoom${zoomStep}`]}`}
        />
      </div>

      {count > 1 && (
        <button type="button" className={`${s.navBtn} ${s.navNext}`} onClick={goNext} aria-label="Next image">
          <IconChevronRight size={22} />
        </button>
      )}

      {count > 1 && (
        <div className={s.counter}>
          {index + 1} / {count}
        </div>
      )}
    </div>
  )
}
