import api, { apiUpload } from '../utils/api'
import { API } from '../constants/api'

export const postsService = {
  getAll: (params) => api.get(API.POSTS.LIST, { params }),
  getFavorites: (params) => api.get(API.POSTS.FAVORITES, { params }),
  getSubscriptions: (params) => api.get(API.POSTS.SUBSCRIPTIONS, { params }),
  getById: (id) => api.get(API.POSTS.BY_ID(id)),
  create: (formData) => apiUpload('POST', API.POSTS.CREATE, formData),
  update: (id, formData) => apiUpload('PATCH', API.POSTS.UPDATE(id), formData),
  delete: (id) => api.delete(API.POSTS.DELETE(id)),
  updateStatus: (id, status) => api.patch(API.POSTS.UPDATE_STATUS(id), { status }),
  like: (id, type) => api.post(API.POSTS.LIKE(id), { type }),
  removeLike: (id) => api.delete(API.POSTS.LIKE(id)),
  getLikes: (id) => api.get(API.POSTS.LIKE(id)),
  favorite: (id) => api.post(API.POSTS.FAVORITE(id)),
  unfavorite: (id) => api.delete(API.POSTS.FAVORITE(id)),
  subscribe: (id) => api.post(API.POSTS.SUBSCRIBE(id)),
  unsubscribe: (id) => api.delete(API.POSTS.SUBSCRIBE(id)),
  getComments: (id, params) => api.get(API.POSTS.COMMENTS(id), { params }),
  addComment: (id, content) => api.post(API.POSTS.COMMENTS(id), { content }),
  getCategories: (id) => api.get(API.POSTS.CATEGORIES(id)),
  deleteAttachment: (id, filename) => api.delete(API.POSTS.DELETE_ATTACHMENT(id, filename)),
}
