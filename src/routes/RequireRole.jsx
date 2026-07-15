import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';

export function RequireRole({ allow, children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!allow(user)) {
    return <Navigate to="/dashboard" replace state={{ from: location }} />;
  }

  return children;
}
