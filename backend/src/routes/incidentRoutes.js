import express from "express";
import {
  createIncident,
  getIncidents,
  getIncidentById,
  updateIncidentStatus,
} from "../controllers/incidentController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// Tourists (and authorities) create incidents; any logged-in user can.
router.post("/", protect, createIncident);

// List — controller decides what each role sees.
router.get("/", protect, getIncidents);

// Single incident.
router.get("/:id", protect, getIncidentById);

// Advance status — authority only.
router.patch("/:id/status", protect, authorize("authority"), updateIncidentStatus);

export default router;