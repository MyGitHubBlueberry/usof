import { useContext } from 'react'
import { FlashContext } from '../context/FlashContext'

export function useFlash() {
  const context = useContext(FlashContext)
  if (!context) {
    throw new Error('useFlash must be used within a FlashProvider')
  }

  const result = [context.flash, context.showFlash]
  result.flash = context.flash
  result.showFlash = context.showFlash
  result.clearFlash = context.clearFlash
  return result
}

export default useFlash
