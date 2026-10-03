import { Navigate } from 'react-router-dom';
import { dashboardPathFor, useAuth } from '../context/auth';
import Preloader from './Preloader';

// role is "student" or "alumni"
const ProtectedRoute = ({ role, children }) => {
  const { user, loading } = useAuth();

  if (loading) return <Preloader />;

  if (!user) return <Navigate to="/login" replace />;

  if (user.role !== role) return <Navigate to={dashboardPathFor(user)} replace />;

  return children;
};

export default ProtectedRoute;
