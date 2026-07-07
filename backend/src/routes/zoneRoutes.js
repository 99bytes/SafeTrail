import express from "express";
import {
  createZone,
  getZones,
  updateZone,
  deleteZone,
  checkPoint,
} from "../controllers/zoneController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// Read routes — any logged-in user (tourist or authority)
router.get("/", protect, getZones);
router.get("/check", protect, checkPoint);

// Write routes — must be logged in AND be an authority
router.post("/", protect, authorize("authority"), createZone);
router.patch("/:id", protect, authorize("authority"), updateZone);
router.delete("/:id", protect, authorize("authority"), deleteZone);

export default router;