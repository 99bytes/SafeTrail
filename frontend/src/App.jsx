import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import TouristDashboard from "./pages/TouristDashboard";
import AuthorityDashboard from "./pages/AuthorityDashboard";
import VerifyID from "./pages/VerifyID";
import Landing from "./pages/Landing";

export default function App() {
  const { user } = useAuth();

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Landing />} />

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
