import { createContext, useContext, useState } from "react";
import api from "../api";
import { connectSocket, disconnectSocket } from "../socket";

// A React Context holds the logged-in user + token so any component can read it
// without passing props down manually. This is our tiny "global state".
const AuthContext = createContext();

export function AuthProvider({ children }) {
  // Initialise from localStorage so a refresh keeps you logged in.
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  // Shared handler for both login and register responses.
  const handleAuth = ({ token, user }) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setUser(user);
    connectSocket(); // open the realtime connection now that we have a token
  };

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    handleAuth(data);
  };

  const register = async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    handleAuth(data);
  };

  const logout = () => {
    disconnectSocket();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Convenience hook: const { user, login, logout } = useAuth();
export const useAuth = () => useContext(AuthContext);
