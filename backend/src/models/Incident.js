import mongoose from "mongoose";

// One entry in the incident's audit trail — recorded each time status changes.
const statusEntrySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["reported", "acknowledged", "responding", "resolved"],
      required: true,
    },
    at: { type: Date, default: Date.now },
    by: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // who changed it
  },
  { _id: false } // these sub-entries don't need their own ids
);

const incidentSchema = new mongoose.Schema(
  {
    touristId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: ["sos", "reported"], // sos = panic button, reported = non-urgent report
      required: true,
    },

    description: { type: String, trim: true }, // optional, mainly for "reported"

    // Where it happened — a GeoJSON Point: { type:"Point", coordinates:[lng,lat] }
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
        required: true,
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },

    // Which zone (if any) the incident fell inside — filled in automatically.
    zoneAtTime: {
      zoneId: { type: mongoose.Schema.Types.ObjectId, ref: "Zone" },
      name: String,
      type: { type: String }, // safe | caution | restricted
    },

    status: {
      type: String,
      enum: ["reported", "acknowledged", "responding", "resolved"],
      default: "reported",
    },

    handledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // the authority currently handling it
      default: null,
    },

    statusHistory: [statusEntrySchema], // audit trail
  },
  { timestamps: true }
);

// Geospatial index so we could query incidents by location later if needed.
incidentSchema.index({ location: "2dsphere" });

const Incident = mongoose.model("Incident", incidentSchema);
export default Incident;