import * as turf from "@turf/turf";
import Incident from "../models/Incident.js";
import Zone from "../models/Zone.js";

// The allowed forward transitions. Key = current status, value = what it may become.
const NEXT_ALLOWED = {
  reported: ["acknowledged"],
  acknowledged: ["responding"],
  responding: ["resolved"],
  resolved: [], // terminal — can't go anywhere from here
};

// Helper: given a point [lng,lat], find which zone (if any) it sits in.
const findZoneForPoint = async (lng, lat) => {
  const point = turf.point([lng, lat]);
  const zones = await Zone.find();
  const match = zones.find((zone) => {
    const polygon = turf.polygon(zone.area.coordinates);
    return turf.booleanPointInPolygon(point, polygon);
  });
  if (!match) return null;
  return { zoneId: match._id, name: match.name, type: match.type };
};

// POST /api/incidents   (tourist creates an SOS or a report)
export const createIncident = async (req, res) => {
  try {
    const { type, description, lng, lat } = req.body;

    if (!type || lng === undefined || lat === undefined) {
      return res.status(400).json({ message: "type, lng and lat are required" });
    }
    if (!["sos", "reported"].includes(type)) {
      return res.status(400).json({ message: "type must be 'sos' or 'reported'" });
    }

    const longitude = parseFloat(lng);
    const latitude = parseFloat(lat);
    if (Number.isNaN(longitude) || Number.isNaN(latitude)) {
      return res.status(400).json({ message: "lng and lat must be numbers" });
    }

    // Auto-tag which zone this happened in (may be null if outside all zones).
    const zoneAtTime = await findZoneForPoint(longitude, latitude);

    const incident = await Incident.create({
      touristId: req.user.id, // from protect middleware — the logged-in tourist
      type,
      description,
      location: { type: "Point", coordinates: [longitude, latitude] },
      zoneAtTime: zoneAtTime || undefined,
      status: "reported",
      statusHistory: [{ status: "reported", at: new Date(), by: req.user.id }],
    });

    // Notify all authorities in real time that a new incident arrived.
    const populated = await incident.populate("touristId", "name email");
    req.app.get("io").to("authorities").emit("incident:new", populated);

    res.status(201).json(incident);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET /api/incidents
// Authority sees ALL incidents. Tourist sees only their OWN.
export const getIncidents = async (req, res) => {
  try {
    const filter = req.user.role === "authority" ? {} : { touristId: req.user.id };
    const incidents = await Incident.find(filter)
      .sort({ createdAt: -1 })
      .populate("touristId", "name email") // include tourist's name/email
      .populate("handledBy", "name");
    res.json(incidents);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET /api/incidents/:id
export const getIncidentById = async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id)
      .populate("touristId", "name email")
      .populate("handledBy", "name");

    if (!incident) return res.status(404).json({ message: "Incident not found" });

    // A tourist may only view their own incident.
    if (
      req.user.role !== "authority" &&
      incident.touristId._id.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: "Forbidden" });
    }

    res.json(incident);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// PATCH /api/incidents/:id/status   (authority only)
export const updateIncidentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: "status is required" });

    const incident = await Incident.findById(req.params.id);
    if (!incident) return res.status(404).json({ message: "Incident not found" });

    // Enforce the state machine: only allow valid forward transitions.
    const allowedNext = NEXT_ALLOWED[incident.status];
    if (!allowedNext.includes(status)) {
      return res.status(400).json({
        message: `Cannot move from '${incident.status}' to '${status}'. Allowed next: ${
          allowedNext.length ? allowedNext.join(", ") : "none (already resolved)"
        }`,
      });
    }

    incident.status = status;
    incident.handledBy = req.user.id; // the authority taking action
    incident.statusHistory.push({ status, at: new Date(), by: req.user.id });
    await incident.save();

    // Push the update to the tourist who owns this incident (their room),
    // and also refresh any authorities watching.
    const io = req.app.get("io");
    io.to(`user:${incident.touristId}`).emit("incident:updated", incident);
    io.to("authorities").emit("incident:updated", incident);

    res.json(incident);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};