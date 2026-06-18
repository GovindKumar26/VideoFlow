import React from "react";
import { useSelector } from "react-redux";
import { useLocation, Navigate } from "react-router-dom";

// Open src/components/AdminProtectedRoute.jsx and replace your guard logic with this:

export default function AdminProtectedRoute({ children }) {
  const authState = useSelector((state) => state.auth);
  const location = useLocation();

  if (authState?.isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-xs font-mono">Verifying authorization...</div>;
  }

  if (!authState?.isAuthenticated) {
    return <Navigate to="/auth/signin" state={{ from: location }} replace />;
  }

  // 🎯 Dynamic fallback gate check
  const checkRole = authState?.role || authState?.user?.role;

  if (checkRole !== "admin") {
    return <Navigate to="/dashboard/webhooks" replace />;
  }

  return children;
}