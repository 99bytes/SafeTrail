import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import TouristDashboard from "./pages/TouristDashboard";
import AuthorityDashboard from "./pages/AuthorityDashboard";
import VerifyID from "./pages/VerifyID";

export default function App() {
  const { user } = useAuth();

  // Send the logged-in user to the dashboard that matches their role.
  const Home = () => {
    if (!user) return <Navigate to="/login" replace />;
    return user.role === "authority" ? (
      <Navigate to="/authority" replace />
    ) : (
      <Navigate to="/tourist" replace />
    );
  };

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Home />} />

        <Route
          path="/tourist"
          element={
            <ProtectedRoute role="tourist">
              <TouristDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/authority"
          element={
            <ProtectedRoute role="authority">
              <AuthorityDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/verify"
          element={
            <ProtectedRoute role="authority">
              <VerifyID />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}
