import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Wraps a page so only logged-in users (optionally of a given role) can see it.
// Usage: <ProtectedRoute role="authority"><AuthorityDashboard/></ProtectedRoute>
export default function ProtectedRoute({ children, role }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;

  return children;
}
