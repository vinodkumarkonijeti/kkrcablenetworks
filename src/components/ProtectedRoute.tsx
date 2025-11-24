import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
// Using react-router <Navigate /> behavior (reverted from SafeNavigate)

type AllowedRole = 'admin' | 'operator' | 'customer';

export const ProtectedRoute = ({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: AllowedRole[];
}) => {
  const { currentUser, userData, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentUser) {
    console.log('[ProtectedRoute] User not logged in, redirecting to login');
    return <Navigate to="/login" />;
  }

  // If allowedRoles provided, enforce role check
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = (userData as any)?.role as AllowedRole | undefined;
    if (!userRole || !allowedRoles.includes(userRole)) {
      console.warn('[ProtectedRoute] User role not authorized:', { userRole, allowedRoles });
      return <Navigate to="/" />;
    }
  }

  return <>{children}</>;
};
