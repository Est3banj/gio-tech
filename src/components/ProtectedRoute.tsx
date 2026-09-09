import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { UserRole } from '../types';

export interface ProtectedRouteProps {
  children?: React.ReactNode;
  allowedRoles?: UserRole[];
  redirectPath?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  redirectPath = '/login',
}) => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center flex-column py-5"
        style={{ minHeight: '60vh' }}
        data-testid="protected-route-loading"
      >
        <div
          className="spinner-border text-danger"
          role="status"
          style={{ width: '3rem', height: '3rem', borderWidth: '0.25rem' }}
        >
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="mt-3 text-muted fw-medium fs-6">Verificando sesión...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={redirectPath} replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !role) {
    return <Navigate to="/" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
