export const ROUTES = {
  HOME: '/',
  FAVORITES: '/favorites',
  SUBSCRIPTIONS: '/subscriptions',
  LOGIN: '/login',
  REGISTER: '/register',
  POST: '/posts/:id',
  POST_NEW: '/posts/new',
  POST_EDIT: '/posts/:id/edit',
  PROFILE_ME: '/profile',
  PROFILE: '/users/:id',
  USER_POSTS: '/users/:id/posts',
  PROFILE_POSTS: '/profile/posts',
  LEADERBOARD: '/leaderboard',
  NOTIFICATIONS: '/notifications',
  ADMIN: '/admin',
  CONFIRM_EMAIL: '/confirm-email/:token',
  PASSWORD_RESET: '/password-reset',
  PASSWORD_RESET_CONFIRM: '/password-reset/:token',
}

export const toPost = (id) => `/posts/${id}`
export const toPostEdit = (id) => `/posts/${id}/edit`
export const toProfile = (id) => (id ? `/users/${id}` : '/profile')
export const toUserPosts = (id) => (id ? `/users/${id}/posts` : '/profile/posts')
export const toConfirmEmail = (token) => `/confirm-email/${token}`
export const toPasswordResetConfirm = (token) => `/password-reset/${token}`
