import mongoose from "mongoose";

// A DigitalID is a securely-issued record for a tourist, shown as a QR code.
// It is NOT blockchain — just a unique, time-bound, revocable credential.
const digitalIdSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // one active digital ID per user
    },
    idCode: {
      type: String,
      required: true,
      unique: true, // the public code authorities verify against
    },
    validFrom: { type: Date, default: Date.now },
    validUntil: { type: Date, required: true },
    status: {
      type: String,
      enum: ["active", "expired", "revoked"],
      default: "active",
    },
    // The string encoded into the QR image on the frontend.
    qrPayload: { type: String, required: true },
  },
  { timestamps: true }
);

const DigitalID = mongoose.model("DigitalID", digitalIdSchema);
export default DigitalID;
