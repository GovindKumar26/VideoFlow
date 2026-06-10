import { useSelector } from "react-redux";
import { useLocation, Navigate } from "react-router-dom";


export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useSelector(
    (state) => state.auth
  );

  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/auth/signin"
        state={{ from: location }}
        replace
      />
    );
  }

  return children;
}