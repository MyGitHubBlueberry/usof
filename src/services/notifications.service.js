import api from '../utils/api'
import { API } from '../constants/api'

export const notificationsService = {
  getAll: (params) => api.get(API.NOTIFICATIONS.LIST, { params }),
  getUnreadCount: () => api.get(API.NOTIFICATIONS.UNREAD_COUNT),
  readAll: () => api.patch(API.NOTIFICATIONS.READ_ALL),
  read: (id) => api.patch(API.NOTIFICATIONS.READ(id)),
  delete: (id) => api.delete(API.NOTIFICATIONS.DELETE(id)),
  deleteAll: () => api.delete(API.NOTIFICATIONS.DELETE_ALL),
}
