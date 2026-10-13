import api from '../utils/api'
import { API } from '../constants/api'

export const authService = {
  login: (credentials) => api.post(API.AUTH.LOGIN, credentials),
  register: (data) => api.post(API.AUTH.REGISTER, data),
  logout: () => api.post(API.AUTH.LOGOUT),
  resendVerification: (email) => api.post(API.AUTH.RESEND_VERIFICATION, { email }),
  confirmEmail: (token) => api.post(API.AUTH.CONFIRM_EMAIL(token)),
  requestPasswordReset: (email) => api.post(API.AUTH.PASSWORD_RESET, { email }),
  resetPassword: (token, newPassword) => api.post(API.AUTH.PASSWORD_RESET_CONFIRM(token), { new_password: newPassword }),
}
