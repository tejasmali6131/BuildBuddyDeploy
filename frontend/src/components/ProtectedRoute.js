import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loading from './common/Loading';

const ProtectedRoute = ({ children, requiredRole = null, fallback = null }) => {
  const { user, loading, isAuthenticated, hasRole } = useAuth();

  // Show loading while checking authentication
  if (loading) {
    return (
      <Loading 
        fullScreen={true}
        type="pulse"
        message="Verifying access..."
        size="medium"
      />
    );
  }

  // Not authenticated - redirect to signin
  if (!isAuthenticated()) {
    return <Navigate to="/signin" replace />;
  }

  // Check role if required
  if (requiredRole && !hasRole(requiredRole)) {
    // If fallback component is provided, show it
    if (fallback) {
      return fallback;
    }
    
    // Otherwise redirect based on user's actual role
    if (user?.userType === 'customer') {
      return <Navigate to="/dashboard/customer" replace />;
    } else if (user?.userType === 'architect') {
      return <Navigate to="/dashboard/architect" replace />;
    } else {
      return <Navigate to="/" replace />;
    }
  }

  // All checks passed - render the protected component
  return children;
};

export default ProtectedRoute;