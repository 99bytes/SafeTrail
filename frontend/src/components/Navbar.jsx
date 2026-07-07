import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar" style={{ flexWrap: "wrap", gap: "12px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <img src="/logo.png" alt="SafeTrail Logo" style={{ height: "28px", borderRadius: "4px" }} />
          <span>SafeTrail</span>
        </Link>
        {user?.role === "authority" && <Link to="/verify">Verify ID</Link>}
      </div>
      <div>
        {user ? (
          <>
            <span style={{ marginRight: 12 }}>
              {user.name} ({user.role})
            </span>
            <button className="ghost" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <Link to="/login">Login</Link>
        )}
      </div>
    </nav>
  );
}
