import mongoose from "mongoose";

// A Zone is a labelled area on the map (safe / caution / restricted).
// Its shape is stored as GeoJSON so MongoDB can run geo-queries on it.
const zoneSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    type: {
      type: String,
      enum: ["safe", "caution", "restricted"], // only these three allowed
      required: true,
    },

    // GeoJSON Polygon. Structure:
    //   type: "Polygon"
    //   coordinates: [ [ [lng, lat], [lng, lat], ... , [lng, lat-same-as-first] ] ]
    // Note the DOUBLE array around the ring, and that the ring must close
    // (first point == last point).
    area: {
      type: {
        type: String,
        enum: ["Polygon"],
        default: "Polygon",
        required: true,
      },
      coordinates: {
        type: [[[Number]]], // array → array → array of numbers ([lng,lat] pairs)
        required: true,
      },
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // which authority made this zone
      required: true,
    },
  },
  { timestamps: true }
);

// A "2dsphere" index lets MongoDB do fast geospatial queries on the area field.
zoneSchema.index({ area: "2dsphere" });

const Zone = mongoose.model("Zone", zoneSchema);
export default Zone;