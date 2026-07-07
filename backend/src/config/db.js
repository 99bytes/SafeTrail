import mongoose from "mongoose";

// Connects to MongoDB Atlas using the URI from .env.
// We export a function so server.js can call it on startup.
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1); // stop the app if the DB won't connect
  }
};

export default connectDB;