import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polygon,
  CircleMarker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import api from "../api";
import { connectSocket } from "../socket";

const ZONE_COLORS = { safe: "#16a34a", caution: "#d97706", restricted: "#dc2626" };

// What each status can advance to (mirrors the server's state machine).
const NEXT = {
  reported: "acknowledged",
  acknowledged: "responding",
  responding: "resolved",
  resolved: null,
};

function MapController({ centerPos }) {
  const map = useMap();
  useEffect(() => {
    if (centerPos) {
      map.flyTo(centerPos, 16);
    }
  }, [centerPos, map]);
  return null;
}

// Small helper component: it lives INSIDE the map and listens for clicks.
// react-leaflet's useMapEvents only works for a child of <MapContainer>.
// While "drawing" is on, each map click adds a [lat,lng] point.
function ClickCapture({ drawing, onAddPoint }) {
  useMapEvents({
    click(e) {
      if (drawing) onAddPoint([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

export default function AuthorityDashboard() {
  const [incidents, setIncidents] = useState([]);
  const [zones, setZones] = useState([]);
  const [flash, setFlash] = useState("");
  const [focusPos, setFocusPos] = useState(null);

  // --- zone drawing state ---
  const [drawing, setDrawing] = useState(false);
  const [points, setPoints] = useState([]); // array of [lat,lng] clicked points
  const [zoneName, setZoneName] = useState("");
  const [zoneType, setZoneType] = useState("safe");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/incidents").then((r) => setIncidents(r.data)).catch(() => {});
    api.get("/zones").then((r) => setZones(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const socket = connectSocket();
    if (!socket) return;
    const onNew = (incident) => {
      setIncidents((prev) => [incident, ...prev]);
      setFlash(`🚨 New ${incident.type} from ${incident.touristId?.name || "tourist"}`);
    };
    const onUpdated = (updated) => {
      setIncidents((prev) =>
        prev.map((i) => (i._id === updated._id ? { ...i, ...updated } : i))
      );
    };
    socket.on("incident:new", onNew);
    socket.on("incident:updated", onUpdated);
    return () => {
      socket.off("incident:new", onNew);
      socket.off("incident:updated", onUpdated);
    };
  }, []);

  const advance = async (incident) => {
    const next = NEXT[incident.status];
    if (!next) return;
    try {
      const { data } = await api.patch(`/incidents/${incident._id}/status`, {
        status: next,
      });
      setIncidents((prev) => prev.map((i) => (i._id === data._id ? data : i)));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update");
    }
  };

  // Save the drawn polygon as a new zone.
  const saveZone = async () => {
    if (points.length < 3) return alert("Click at least 3 points on the map.");
    if (!zoneName.trim()) return alert("Give the zone a name.");
    setSaving(true);
    try {
      // Leaflet gave us [lat,lng]; GeoJSON needs [lng,lat]. And the ring must be
      // CLOSED, so we append the first point again at the end.
      const ring = points.map(([lat, lng]) => [lng, lat]);
      ring.push(ring[0]);

      const { data } = await api.post("/zones", {
        name: zoneName,
        type: zoneType,
        coordinates: [ring], // GeoJSON Polygon = array of rings
      });
      setZones((prev) => [data, ...prev]);
      // reset the draw tool
      setPoints([]);
      setZoneName("");
      setDrawing(false);
      setFlash(`Zone "${data.name}" created ✅`);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save zone");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container">
      <h2>Authority Dashboard</h2>
      {flash && <div className="card" style={{ background: "#fff4f4" }}>{flash}</div>}

      {/* --- Zone drawing controls --- */}
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Zones</h3>
        {!drawing ? (
          <button onClick={() => setDrawing(true)}>➕ Draw a new zone</button>
        ) : (
          <div>
            <p style={{ margin: "0 0 8px", color: "#555" }}>
              Click points on the map to trace the area, then name it and save.
              ({points.length} point{points.length !== 1 ? "s" : ""} placed)
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <input
                style={{ flex: 1, minWidth: 160, margin: 0 }}
                placeholder="Zone name"
                value={zoneName}
                onChange={(e) => setZoneName(e.target.value)}
              />
              <select
                style={{ width: 140, margin: 0 }}
                value={zoneType}
                onChange={(e) => setZoneType(e.target.value)}
              >
                <option value="safe">safe</option>
                <option value="caution">caution</option>
                <option value="restricted">restricted</option>
              </select>
              <button onClick={saveZone} disabled={saving}>
                {saving ? "Saving…" : "Save zone"}
              </button>
              <button className="ghost" onClick={() => setPoints([])}>
                Clear points
              </button>
              <button
                className="ghost"
                onClick={() => {
                  setDrawing(false);
                  setPoints([]);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- Live map --- */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <MapContainer center={[28.6139, 77.2090]} zoom={12} style={{ height: "45vh", minHeight: 300, maxHeight: 450 }}>
          <TileLayer
            attribution="&copy; OpenStreetMap"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapController centerPos={focusPos} />
          <ClickCapture
            drawing={drawing}
            onAddPoint={(p) => setPoints((prev) => [...prev, p])}
          />

          {/* existing zones */}
          {zones.map((z) => (
            <Polygon
              key={z._id}
              positions={z.area.coordinates[0].map(([lng, lat]) => [lat, lng])}
              pathOptions={{ color: ZONE_COLORS[z.type], fillOpacity: 0.15 }}
            />
          ))}

          {/* the polygon being drawn right now */}
          {points.length > 0 && (
            <>
              <Polygon
                positions={points}
                pathOptions={{ color: ZONE_COLORS[zoneType], dashArray: "6" }}
              />
              {points.map((p, idx) => (
                <CircleMarker key={idx} center={p} radius={5} />
              ))}
            </>
          )}

          {/* incident markers */}
          {incidents.filter(i => i.status !== "resolved").map((i) => (
            <Marker
              key={i._id}
              position={[i.location.coordinates[1], i.location.coordinates[0]]}
            >
              <Popup>
                <b>{i.type.toUpperCase()}</b> — {i.status}
                <br />
                {i.touristId?.name}
                <br />
                {i.zoneAtTime?.name || "outside zones"}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* --- Incident queue --- */}
      <div className="card">
        <h3>Incidents ({incidents.length})</h3>
        {incidents.length === 0 && <p>No incidents yet. Waiting for reports…</p>}
        {incidents.map((i) => (
          <div
            key={i._id}
            onClick={() => {
              if (i.location?.coordinates) {
                setFocusPos([i.location.coordinates[1], i.location.coordinates[0]]);
              }
            }}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "8px",
              padding: "10px 0",
              borderBottom: "1px solid #eee",
              cursor: i.location?.coordinates ? "pointer" : "default",
            }}
          >
            <div>
              <span className={`badge ${i.type === "sos" ? "sos" : "reported"}`}>
                {i.type}
              </span>{" "}
              <span className={`badge ${i.status}`}>{i.status}</span>
              <div style={{ fontSize: 13, color: "#555" }}>
                {i.touristId?.name || "Tourist"} · {i.zoneAtTime?.name || "outside zones"}
                {i.location?.coordinates ? ` · [Lat: ${i.location.coordinates[1].toFixed(4)}, Lng: ${i.location.coordinates[0].toFixed(4)}]` : ""}
                {i.description ? ` · ${i.description}` : ""}
              </div>
            </div>
            {NEXT[i.status] ? (
              <button onClick={() => advance(i)}>Mark {NEXT[i.status]}</button>
            ) : (
              <span className="badge resolved">done</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
