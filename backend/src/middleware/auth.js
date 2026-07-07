import jwt from "jsonwebtoken";

// "Middleware" runs BEFORE a route handler. This one checks for a valid
// token in the Authorization header and attaches the user info to req.
export const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    const token = authHeader.split(" ")[1]; // "Bearer <token>" -> "<token>"
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role } — we put this in the token when signing
    next(); // pass control to the next handler
  } catch (error) {
    return res.status(401).json({ message: "Not authorized, token invalid" });
  }
};

// Factory that returns a middleware allowing only certain roles.
// Usage: authorize("authority")
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: insufficient role" });
    }
    next();
  };
};