import api from '../utils/api'
import { API } from '../constants/api'

export const commentsService = {
  getById: (id) => api.get(API.COMMENTS.BY_ID(id)),
  update: (id, content) => api.patch(API.COMMENTS.UPDATE(id), { content }),
  delete: (id) => api.delete(API.COMMENTS.DELETE(id)),
  resolve: (id) => api.patch(API.COMMENTS.RESOLVE(id)),
  updateStatus: (id, status) => api.patch(API.COMMENTS.UPDATE_STATUS(id), { status }),
  like: (id, type) => api.post(API.COMMENTS.LIKE(id), { type }),
  removeLike: (id) => api.delete(API.COMMENTS.LIKE(id)),
  getLikes: (id) => api.get(API.COMMENTS.LIKE(id)),
  reply: (id, content) => api.post(API.COMMENTS.REPLY(id), { content }),
}
