export const ROUTES = {
  HOME: '/',
  FAVORITES: '/favorites',
  SUBSCRIPTIONS: '/subscriptions',
  LOGIN: '/login',
  REGISTER: '/register',
  POST: '/posts/:id',
  POST_NEW: '/posts/new',
  POST_EDIT: '/posts/:id/edit',
  PROFILE: '/users/:id',
  USER_POSTS: '/users/:id/posts',
  LEADERBOARD: '/leaderboard',
  NOTIFICATIONS: '/notifications',
  ADMIN: '/admin',
  CONFIRM_EMAIL: '/confirm-email/:token',
  PASSWORD_RESET: '/password-reset',
  PASSWORD_RESET_CONFIRM: '/password-reset/:token',
}

export const toPost = (id) => `/posts/${id}`
export const toPostEdit = (id) => `/posts/${id}/edit`
export const toProfile = (id) => `/users/${id}`
export const toUserPosts = (id) => `/users/${id}/posts`
export const toConfirmEmail = (token) => `/confirm-email/${token}`
export const toPasswordResetConfirm = (token) => `/password-reset/${token}`
