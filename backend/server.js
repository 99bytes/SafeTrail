import http from "http";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";

import connectDB from "./src/config/db.js";
import authRoutes from "./src/routes/authRoutes.js";
import zoneRoutes from "./src/routes/zoneRoutes.js";
import incidentRoutes from "./src/routes/incidentRoutes.js";
import digitalIdRoutes from "./src/routes/digitalIdRoutes.js";

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.json({ message: "API is running" }));

// --- Socket.io setup -------------------------------------------------------
// We wrap Express in a raw HTTP server so Socket.io can share the same port.
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Verify the JWT on connect, then put each socket in the right room(s):
//  - every user joins a personal room  "user:<id>"  (for incident:updated)
//  - authorities also join the shared  "authorities" room (for incident:new)
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("No token"));
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded; // { id, role }
    next();
  } catch {
    next(new Error("Auth failed"));
  }
});

io.on("connection", (socket) => {
  socket.join(`user:${socket.user.id}`);
  if (socket.user.role === "authority") socket.join("authorities");
});

// Make io available inside controllers via req.app.get("io").
app.set("io", io);
// ---------------------------------------------------------------------------

app.use("/api/auth", authRoutes);
app.use("/api/zones", zoneRoutes);
app.use("/api/incidents", incidentRoutes);
app.use("/api/digital-id", digitalIdRoutes);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
