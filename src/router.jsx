import { lazy } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { ROUTES } from './constants/routes'
import RootLayout from './components/layouts/RootLayout.jsx'
import AuthLayout from './components/layouts/AuthLayout.jsx'
import Home from './pages/Home'
const UserPosts = lazy(() => import('./pages/UserPosts'))
const PostDetails = lazy(() => import('./pages/PostDetails'))
const PostCreate = lazy(() => import('./pages/PostCreate'))
const PostEdit = lazy(() => import('./pages/PostEdit'))
const Profile = lazy(() => import('./pages/Profile'))
const Leaderboard = lazy(() => import('./pages/Leaderboard'))
const Admin = lazy(() => import('./pages/Admin'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const EmailConfirm = lazy(() => import('./pages/EmailConfirm'))
const PasswordResetRequest = lazy(() => import('./pages/PasswordResetRequest'))
const PasswordResetConfirm = lazy(() => import('./pages/PasswordResetConfirm'))
const NotFound = lazy(() => import('./pages/NotFound'))

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
