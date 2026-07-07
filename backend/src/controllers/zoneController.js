import * as turf from "@turf/turf";
import Zone from "../models/Zone.js";

// Helper: validate that incoming coordinates look like a proper closed polygon ring.
// coordinates should be: [ [ [lng,lat], [lng,lat], [lng,lat], ... ] ]
const isValidPolygon = (coordinates) => {
  if (!Array.isArray(coordinates) || coordinates.length === 0) return false;
  const ring = coordinates[0];
  if (!Array.isArray(ring) || ring.length < 4) return false; // ≥3 corners + closing point

  const everyPointValid = ring.every(
    (p) => Array.isArray(p) && p.length === 2 &&
           typeof p[0] === "number" && typeof p[1] === "number"
  );
  if (!everyPointValid) return false;

  // ring must be closed: first point equals last point
  const first = ring[0];
  const last = ring[ring.length - 1];
  return first[0] === last[0] && first[1] === last[1];
};

// POST /api/zones   (authority only)
export const createZone = async (req, res) => {
  try {
    const { name, type, coordinates } = req.body;

    if (!name || !type || !coordinates) {
      return res.status(400).json({ message: "name, type, coordinates are required" });
    }
    if (!isValidPolygon(coordinates)) {
      return res.status(400).json({
        message:
          "coordinates must be [[[lng,lat],...]] with ≥3 corners and the ring closed (first point == last point)",
      });
    }

    const zone = await Zone.create({
      name,
      type,
      area: { type: "Polygon", coordinates },
      createdBy: req.user.id, // set by the protect middleware
    });

    res.status(201).json(zone);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET /api/zones   (any logged-in user — tourists need to see zones too)
export const getZones = async (req, res) => {
  try {
    const zones = await Zone.find().sort({ createdAt: -1 });
    res.json(zones);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// PATCH /api/zones/:id   (authority only)
export const updateZone = async (req, res) => {
  try {
    const { name, type, coordinates } = req.body;
    const update = {};

    if (name) update.name = name;
    if (type) update.type = type;
    if (coordinates) {
      if (!isValidPolygon(coordinates)) {
        return res.status(400).json({ message: "Invalid polygon coordinates" });
      }
      update.area = { type: "Polygon", coordinates };
    }

    const zone = await Zone.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });

    if (!zone) return res.status(404).json({ message: "Zone not found" });
    res.json(zone);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// DELETE /api/zones/:id   (authority only)
export const deleteZone = async (req, res) => {
  try {
    const zone = await Zone.findByIdAndDelete(req.params.id);
    if (!zone) return res.status(404).json({ message: "Zone not found" });
    res.json({ message: "Zone deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET /api/zones/check?lng=..&lat=..   (any logged-in user)
// Returns which zone(s) a given point falls inside, using point-in-polygon.
export const checkPoint = async (req, res) => {
  try {
    const lng = parseFloat(req.query.lng);
    const lat = parseFloat(req.query.lat);

    if (Number.isNaN(lng) || Number.isNaN(lat)) {
      return res.status(400).json({ message: "lng and lat query params are required numbers" });
    }

    const point = turf.point([lng, lat]);
    const zones = await Zone.find();

    const matching = zones.filter((zone) => {
      const polygon = turf.polygon(zone.area.coordinates);
      return turf.booleanPointInPolygon(point, polygon);
    });

    res.json({
      insideAnyZone: matching.length > 0,
      zones: matching.map((z) => ({ id: z._id, name: z.name, type: z.type })),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};