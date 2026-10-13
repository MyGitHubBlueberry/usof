import { Link } from 'react-router-dom'
import { ROUTES, toProfile } from '../../constants/routes'
import { store } from '../../redux/store.js';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '../../redux/slices/authSlice.js';

export default function Header() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  return (
    <header>
      <Link to={ROUTES.HOME}>USOF</Link>
      <nav>
        <Link to={ROUTES.LOGIN}>Login</Link>
        <Link to={ROUTES.REGISTER}>Register</Link>
      </nav>
      <Link to={isAuthenticated ? toProfile(store.getState().auth.user.id) : ROUTES.LOGIN}>Profile</Link>
    </header>
  )
}
