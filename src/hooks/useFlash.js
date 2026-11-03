import { useDispatch, useSelector } from 'react-redux'
import { showFlash as showFlashThunk, flashCleared } from '../redux/slices/flashSlice'

export function useFlash() {
  const dispatch = useDispatch()
  const flashState = useSelector((state) => state.flash)
  const flash = flashState.msg ? flashState : null

  const showFlash = (msg, type = 'success') => dispatch(showFlashThunk(msg, type))
  const clearFlash = () => dispatch(flashCleared())

  const result = [flash, showFlash]
  result.flash = flash
  result.showFlash = showFlash
  result.clearFlash = clearFlash
  return result
}

export default useFlash
