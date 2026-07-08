import { io } from "socket.io-client";

// Create a socket connection, passing the JWT so the server can put us in the
// right rooms (personal room + "authorities" room). We connect lazily so the
// token is available. Call connectSocket() after login, disconnect on logout.
let socket = null;

export function connectSocket() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  if (socket) return socket;
  socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", { auth: { token } });
  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
