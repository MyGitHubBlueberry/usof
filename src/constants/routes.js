export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  POST: '/posts/:id',
  POST_NEW: '/posts/new',
  POST_EDIT: '/posts/:id/edit',
  PROFILE: '/users/:id',
  USER_POSTS: '/users/:id/posts',
  LEADERBOARD: '/leaderboard',
  ADMIN: '/admin',
  CONFIRM_EMAIL: '/confirm-email/:token',
  PASSWORD_RESET: '/password-reset',
  PASSWORD_RESET_CONFIRM: '/password-reset/:token',
}

export const toPost = (id) => `/posts/${id}`
export const toPostEdit = (id) => `/posts/${id}/edit`
export const toProfile = (id) => `/users/${id}`
export const toProfileTab = (id, tab) => `/users/${id}?tab=${tab}`
export const toUserPosts = (id) => `/users/${id}/posts`
export const toConfirmEmail = (token) => `/confirm-email/${token}`
export const toPasswordResetConfirm = (token) => `/password-reset/${token}`
