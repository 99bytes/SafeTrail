import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Polygon, Marker, Popup } from "react-leaflet";
import { QRCodeSVG } from "qrcode.react";
import api from "../api";
import { connectSocket } from "../socket";

// Fill colors for the three zone types (semi-transparent).
const ZONE_COLORS = {
  safe: "#16a34a",
  caution: "#d97706",
  restricted: "#dc2626",
};

// A default map center (Bengaluru-ish) used until we get real geolocation.
const FALLBACK = { lat: 12.95, lng: 77.55 };

export default function TouristDashboard() {
  const [zones, setZones] = useState([]);
  const [pos, setPos] = useState(FALLBACK);
  const [digitalId, setDigitalId] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [desc, setDesc] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Load zones, the tourist's own incidents, and their digital ID once.
  useEffect(() => {
    api.get("/zones").then((r) => setZones(r.data)).catch(() => {});
    api.get("/incidents").then((r) => setIncidents(r.data)).catch(() => {});
    api.get("/digital-id/me").then((r) => setDigitalId(r.data)).catch(() => {});

    // Ask the browser for the real device location.
    navigator.geolocation?.getCurrentPosition(
      (p) => setPos({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => {} // if denied, we keep the fallback
    );
  }, []);

  // Live updates: when an authority changes one of MY incidents, refresh it.
  useEffect(() => {
    const socket = connectSocket();
    if (!socket) return;
    const onUpdated = (updated) => {
      setIncidents((prev) =>
        prev.map((i) => (i._id === updated._id ? { ...i, ...updated } : i))
      );
      setMsg(`Your incident is now: ${updated.status}`);
    };
    socket.on("incident:updated", onUpdated);
    return () => socket.off("incident:updated", onUpdated);
  }, []);

  // Send an incident (SOS or a written report) at the current location.
  const fileIncident = async (type) => {
    setLoading(true);
    setMsg("");
    try {
      const { data } = await api.post("/incidents", {
        type,
        description: type === "sos" ? "SOS triggered" : desc,
        lng: pos.lng,
        lat: pos.lat,
      });
      setIncidents((prev) => [data, ...prev]);
      setDesc("");
      setMsg(
        type === "sos"
          ? "🚨 SOS sent! Authorities have been alerted."
          : "Report submitted."
      );
    } catch (err) {
      setMsg(err.response?.data?.message || "Failed to send");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h2>Tourist Dashboard</h2>
      {msg && <div className="card" style={{ background: "#eef6ff" }}>{msg}</div>}

      {/* --- Map with zones + my location --- */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <MapContainer center={[pos.lat, pos.lng]} zoom={13} style={{ height: "45vh", minHeight: 300, maxHeight: 450 }}>
          <TileLayer
            attribution="&copy; OpenStreetMap"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {/* Zones: GeoJSON is [lng,lat]; Leaflet wants [lat,lng], so we flip. */}
          {zones.map((z) => (
            <Polygon
              key={z._id}
              positions={z.area.coordinates[0].map(([lng, lat]) => [lat, lng])}
              pathOptions={{ color: ZONE_COLORS[z.type], fillOpacity: 0.25 }}
            >
              <Popup>
                <b>{z.name}</b> — {z.type}
              </Popup>
            </Polygon>
          ))}
          <Marker position={[pos.lat, pos.lng]}>
            <Popup>You are here</Popup>
          </Marker>
        </MapContainer>
      </div>

      {/* --- SOS + report --- */}
      <div className="card">
        <button className="sos" disabled={loading} onClick={() => fileIncident("sos")}>
          🚨 SOS — I need help now
        </button>
        <div style={{ marginTop: 16 }}>
          <label>Report a non-urgent incident</label>
          <textarea
            rows={2}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Describe what happened…"
          />
          <button
            className="ghost"
            disabled={loading || !desc}
            onClick={() => fileIncident("reported")}
          >
            Submit report
          </button>
        </div>
      </div>

      {/* --- Digital ID with QR --- */}
      {digitalId && (
        <div className="card">
          <h3>My Digital Tourist ID</h3>
          <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
            <QRCodeSVG value={digitalId.qrPayload} size={120} />
            <div>
              <div><b>ID:</b> {digitalId.idCode}</div>
              <div><b>Status:</b> {digitalId.status}</div>
              <div>
                <b>Valid until:</b>{" "}
                {new Date(digitalId.validUntil).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- My incidents --- */}
      <div className="card">
        <h3>My Incidents</h3>
        {incidents.length === 0 && <p>No incidents filed yet.</p>}
        {incidents.map((i) => (
          <div key={i._id} style={{ padding: "8px 0", borderBottom: "1px solid #eee" }}>
            <span className={`badge ${i.type === "sos" ? "sos" : "reported"}`}>
              {i.type}
            </span>{" "}
            <span className={`badge ${i.status}`}>{i.status}</span>
            <div style={{ fontSize: 13, color: "#555" }}>
              {i.description ? `${i.description} · ` : ""}{i.zoneAtTime?.name || "outside zones"}
              {i.location?.coordinates ? ` · [Lat: ${i.location.coordinates[1].toFixed(4)}, Lng: ${i.location.coordinates[0].toFixed(4)}]` : ""}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
