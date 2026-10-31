import { useCallback, useEffect, useRef, useState } from 'react'
import { IconX, IconChevronLeft, IconChevronRight, IconZoomIn, IconZoomOut, IconDownload } from './Icons'
import s from './Lightbox.module.css'

const ZOOM_LEVELS = [1, 1.5, 2, 2.5, 3]
const NAV_COOLDOWN_MS = 300

export default function Lightbox({ images, startIndex = 0, onClose }) {
  const [index, setIndex] = useState(startIndex)
  const [zoomStep, setZoomStep] = useState(0)
  const [shiftHeld, setShiftHeld] = useState(false)
  const overlayRef = useRef(null)
  const lastNavRef = useRef(0)

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

  const zoomIn = useCallback(() => {
    setZoomStep((v) => Math.min(v + 1, ZOOM_LEVELS.length - 1))
  }, [])

  const zoomOut = useCallback(() => {
    setZoomStep((v) => Math.max(v - 1, 0))
  }, [])

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && count > 1) goPrev()
      if (e.key === 'ArrowRight' && count > 1) goNext()
      if (e.key === 'Shift') setShiftHeld(true)
    }
    function handleKeyUp(e) {
      if (e.key === 'Shift') setShiftHeld(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
    }
  }, [onClose, goPrev, goNext, count])

  useEffect(() => {
    const el = overlayRef.current
    if (!el) return

    function handleWheel(e) {
      e.preventDefault()

      if (e.ctrlKey) {
        if (e.deltaY < 0) zoomIn()
        else if (e.deltaY > 0) zoomOut()
        return
      }

      if (count <= 1) return
      const now = Date.now()
      if (now - lastNavRef.current < NAV_COOLDOWN_MS) return
      lastNavRef.current = now

      if (e.deltaY > 0) goNext()
      else if (e.deltaY < 0) goPrev()
    }

    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [count, goNext, goPrev, zoomIn, zoomOut])

  if (!current) return null

  function handleViewportClick(e) {
    if (e.target === e.currentTarget) onClose()
  }

  function handleImageClick() {
    if (shiftHeld) zoomOut()
    else zoomIn()
  }

  return (
    <div className={s.overlay} ref={overlayRef}>
      <button type="button" className={s.closeBtn} onClick={onClose} aria-label="Close preview">
        <IconX size={18} />
      </button>

      <div className={s.zoomControls}>
        <button
          type="button"
          className={s.ctrlBtn}
          onClick={zoomOut}
          disabled={zoomStep === 0}
          aria-label="Zoom out"
        >
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
        <a
          href={current.src}
          download
          className={s.ctrlBtn}
          aria-label="Download image"
          title="Download"
        >
          <IconDownload size={16} />
        </a>
      </div>

      {count > 1 && (
        <button type="button" className={`${s.navBtn} ${s.navPrev}`} onClick={goPrev} aria-label="Previous image">
          <IconChevronLeft size={22} />
        </button>
      )}

      <div className={s.viewport} onClick={handleViewportClick}>
        <img
          key={current.src}
          src={current.src}
          alt={current.alt}
          className={`${s.image} ${s[`zoom${zoomStep}`]} ${shiftHeld ? s.cursorZoomOut : s.cursorZoomIn}`}
          onClick={handleImageClick}
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
