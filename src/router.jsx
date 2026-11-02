import { createBrowserRouter } from 'react-router-dom'
import { ROUTES } from './constants/routes'
import RootLayout from './components/layouts/RootLayout.jsx'
import AuthLayout from './components/layouts/AuthLayout.jsx'
import Home from './pages/Home'
import {
  UserPosts,
  PostDetails,
  PostCreate,
  PostEdit,
  Profile,
  Leaderboard,
  Admin,
  Login,
  Register,
  EmailConfirm,
  PasswordResetRequest,
  PasswordResetConfirm,
  NotFound,
} from './lazyPages'

export const router = createBrowserRouter([
  {
    path: ROUTES.HOME,
    element: <RootLayout />,
    errorElement: <NotFound />,
    children: [
      { index: true, element: <Home /> },
      { path: ROUTES.USER_POSTS, element: <UserPosts /> },
      { path: ROUTES.POST, element: <PostDetails /> },
      { path: ROUTES.POST_NEW, element: <PostCreate /> },
      { path: ROUTES.POST_EDIT, element: <PostEdit /> },
      { path: ROUTES.PROFILE, element: <Profile /> },
      { path: ROUTES.LEADERBOARD, element: <Leaderboard /> },
      { path: ROUTES.ADMIN, element: <Admin /> },
      { path: '*', element: <NotFound /> },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      { path: ROUTES.LOGIN, element: <Login /> },
      { path: ROUTES.REGISTER, element: <Register /> },
      { path: ROUTES.CONFIRM_EMAIL, element: <EmailConfirm /> },
      { path: ROUTES.PASSWORD_RESET, element: <PasswordResetRequest /> },
      { path: ROUTES.PASSWORD_RESET_CONFIRM, element: <PasswordResetConfirm /> },
    ],
  },
])
