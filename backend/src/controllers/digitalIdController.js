import crypto from "crypto";
import DigitalID from "../models/DigitalID.js";
import User from "../models/User.js";

// Build the string the QR code will hold. Kept small + JSON so the verify
// screen can parse it. In a real system you'd sign this; here idCode is the key.
const buildPayload = (idCode, user) =>
  JSON.stringify({ idCode, name: user.name, role: user.role });

// GET /api/digital-id/me   (tourist)
// Returns the caller's digital ID, creating one on first request ("issuance").
export const getMyDigitalId = async (req, res) => {
  try {
    let record = await DigitalID.findOne({ userId: req.user.id });

    if (!record) {
      const user = await User.findById(req.user.id);
      const idCode = "STID-" + crypto.randomBytes(5).toString("hex").toUpperCase();
      const validUntil = new Date();
      validUntil.setFullYear(validUntil.getFullYear() + 1); // valid 1 year

      record = await DigitalID.create({
        userId: req.user.id,
        idCode,
        validUntil,
        qrPayload: buildPayload(idCode, user),
        status: "active",
      });
    }

    res.json(record);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// POST /api/digital-id/verify   (authority scans a QR / types the code)
// Body: { idCode }  ->  tells whether it's valid right now.
export const verifyDigitalId = async (req, res) => {
  try {
    const { idCode } = req.body;
    if (!idCode) return res.status(400).json({ message: "idCode is required" });

    const record = await DigitalID.findOne({ idCode }).populate(
      "userId",
      "name email"
    );

    if (!record) {
      return res.json({ valid: false, reason: "No such ID" });
    }

    const now = new Date();
    const expired = now > record.validUntil;
    const valid = record.status === "active" && !expired;

    res.json({
      valid,
      status: expired && record.status === "active" ? "expired" : record.status,
      tourist: record.userId, // { name, email }
      validUntil: record.validUntil,
      idCode: record.idCode,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// PATCH /api/digital-id/:id/revoke   (authority)
export const revokeDigitalId = async (req, res) => {
  try {
    const record = await DigitalID.findByIdAndUpdate(
      req.params.id,
      { status: "revoked" },
      { new: true }
    );
    if (!record) return res.status(404).json({ message: "Digital ID not found" });
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
