import api from '../utils/api'
import { API } from '../constants/api'

export const categoriesService = {
  getAll: (params) => api.get(API.CATEGORIES.LIST, { params }),
  getById: (id) => api.get(API.CATEGORIES.BY_ID(id)),
  getPosts: (id, params) => api.get(API.CATEGORIES.POSTS(id), { params }),
  create: (data) => api.post(API.CATEGORIES.CREATE, data),
  update: (id, data) => api.patch(API.CATEGORIES.UPDATE(id), data),
  delete: (id) => api.delete(API.CATEGORIES.DELETE(id)),
}
