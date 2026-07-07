import express from "express";
import {
  getMyDigitalId,
  verifyDigitalId,
  revokeDigitalId,
} from "../controllers/digitalIdController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// Tourist fetches (and is issued) their own digital ID.
router.get("/me", protect, getMyDigitalId);

// Authority verifies a scanned/typed ID code.
router.post("/verify", protect, authorize("authority"), verifyDigitalId);

// Authority revokes an ID.
router.patch("/:id/revoke", protect, authorize("authority"), revokeDigitalId);

export default router;
