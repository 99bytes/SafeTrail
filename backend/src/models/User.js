import mongoose from "mongoose";

// A "schema" defines the shape of documents in the users collection.
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,      // no two users with the same email
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true }, // we NEVER store the raw password
    role: {
      type: String,
      enum: ["tourist", "authority"], // only these two values allowed
      default: "tourist",
    },
  },
  { timestamps: true } // auto-adds createdAt and updatedAt
);

const User = mongoose.model("User", userSchema);
export default User;