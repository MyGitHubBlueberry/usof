export const API = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    RESEND_VERIFICATION: '/auth/resend-verification',
    CONFIRM_EMAIL: (token) => `/auth/confirm-email/${token}`,
    PASSWORD_RESET: '/auth/password-reset',
    PASSWORD_RESET_CONFIRM: (token) => `/auth/password-reset/${token}`,
  },

  USERS: {
    LIST: '/users',
    CREATE: '/users',
    BY_ID: (id) => `/users/${id}`,
    UPDATE: (id) => `/users/${id}`,
    DELETE: '/users',
    DELETE_BY_ID: (id) => `/users/${id}`,
    UPDATE_ROLE: (id) => `/users/${id}/role`,
    BAN: (id) => `/users/${id}/ban`,
    BAN_HISTORY: (id) => `/users/${id}/ban`,
    BAN_LOGS: '/users/bans/log',
    SEARCH: '/users/search',
    AVATAR: '/users/avatar/',
    AVATAR_BY_ID: (id) => `/users/${id}/avatar`,
  },

  POSTS: {
    LIST: '/posts',
    FAVORITES: '/posts/favorites',
    SUBSCRIPTIONS: '/posts/subscriptions',
    BY_ID: (id) => `/posts/${id}`,
    CREATE: '/posts',
    UPDATE: (id) => `/posts/${id}`,
    DELETE: (id) => `/posts/${id}`,
    UPDATE_STATUS: (id) => `/posts/${id}/status`,
    LIKE: (id) => `/posts/${id}/like`,
    FAVORITE: (id) => `/posts/${id}/favorite`,
    SUBSCRIBE: (id) => `/posts/${id}/subscribe`,
    COMMENTS: (id) => `/posts/${id}/comments`,
    CATEGORIES: (id) => `/posts/${id}/categories`,
    ATTACHMENT: (id, filename) => `/posts/${id}/attachments/${filename}`,
    DELETE_ATTACHMENT: (id, filename) => `/posts/${id}/attachments/${filename}`,
  },

  COMMENTS: {
    BY_ID: (id) => `/comments/${id}`,
    UPDATE: (id) => `/comments/${id}`,
    DELETE: (id) => `/comments/${id}`,
    RESOLVE: (id) => `/comments/${id}/resolve`,
    UPDATE_STATUS: (id) => `/comments/${id}/status`,
    LIKE: (id) => `/comments/${id}/like`,
    REPLY: (id) => `/comments/${id}/reply`,
  },

  CATEGORIES: {
    LIST: '/categories',
    BY_ID: (id) => `/categories/${id}`,
    CREATE: '/categories',
    UPDATE: (id) => `/categories/${id}`,
    DELETE: (id) => `/categories/${id}`,
    POSTS: (id) => `/categories/${id}/posts`,
  },

  LEADERBOARD: {
    OVERALL: '/leaderboard',
    WEEKLY: '/leaderboard/weekly',
  },

  NOTIFICATIONS: {
    LIST: '/notifications',
    UNREAD_COUNT: '/notifications/unread-count',
    READ_ALL: '/notifications/read-all',
    READ: (id) => `/notifications/${id}/read`,
    DELETE: (id) => `/notifications/${id}`,
    DELETE_ALL: '/notifications',
  },
}
