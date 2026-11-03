import api, { apiUpload } from '../utils/api'
import { API } from '../constants/api'

export const usersService = {
  getAll: (params) => api.get(API.USERS.LIST, { params }),
  getById: (id) => api.get(API.USERS.BY_ID(id)),
  create: (data) => api.post(API.USERS.CREATE, data),
  update: (id, data) => api.patch(API.USERS.UPDATE(id), data),
  deleteOwn: () => api.delete(API.USERS.DELETE),
  deleteById: (id) => api.delete(API.USERS.DELETE_BY_ID(id)),
  updateRole: (id, role) => api.patch(API.USERS.UPDATE_ROLE(id), { role }),
  ban: (id, data) => api.patch(API.USERS.BAN(id), data),
  getBanHistory: (id) => api.get(API.USERS.BAN_HISTORY(id)),
  getBanLogs: (params) => api.get(API.USERS.BAN_LOGS, { params }),
  search: (query, limit = 8) => api.get(API.USERS.SEARCH, { params: { q: query, limit } }),
  uploadAvatar: (formData) => apiUpload('PATCH', API.USERS.AVATAR, formData),
  deleteAvatar: () => api.delete(API.USERS.AVATAR),
  getAvatar: (id) => api.get(API.USERS.AVATAR_BY_ID(id), { responseType: 'blob' }),
  deleteAvatarById: (id) => api.delete(API.USERS.AVATAR_BY_ID(id)),
}
