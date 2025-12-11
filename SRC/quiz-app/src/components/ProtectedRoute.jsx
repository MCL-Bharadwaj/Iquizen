import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check role if required (supports both single role string and array of roles)
  if (requiredRole) {
    const userRoles = user?.roles || [];
    const hasRequiredRole = Array.isArray(requiredRole)
      ? requiredRole.some(role => userRoles.includes(role))
      : userRoles.includes(requiredRole);

    if (!hasRequiredRole) {
      console.log('ProtectedRoute - Access denied. Required:', requiredRole, 'User has:', userRoles);
      // Redirect to role selector to choose appropriate dashboard
      return <Navigate to="/role-selector" replace />;
    }
  }

  return children;
}

export default ProtectedRoute;
