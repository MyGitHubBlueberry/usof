import { createSlice } from '@reduxjs/toolkit'

const flashSlice = createSlice({
  name: 'flash',
  initialState: {
    msg: null,
    type: 'success',
    token: 0,
  },
  reducers: {
    flashShown: (state, action) => {
      state.msg = action.payload.msg
      state.type = action.payload.type
      state.token += 1
    },
    flashCleared: (state) => {
      state.msg = null
    },
  },
})

export const { flashShown, flashCleared } = flashSlice.actions

export function showFlash(msg, type = 'success', timeout = 3000) {
  return (dispatch, getState) => {
    dispatch(flashShown({ msg, type }))
    const { token } = getState().flash
    setTimeout(() => {
      if (getState().flash.token === token) {
        dispatch(flashCleared())
      }
    }, timeout)
  }
}

export default flashSlice.reducer
