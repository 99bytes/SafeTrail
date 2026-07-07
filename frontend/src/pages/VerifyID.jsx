import { useState } from "react";
import api from "../api";

// Authority screen: type (or paste from a scanned QR) an ID code and check it.
export default function VerifyID() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const verify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      // The QR payload is JSON; if they paste the whole thing, pull out idCode.
      let idCode = code.trim();
      if (idCode.startsWith("{")) idCode = JSON.parse(idCode).idCode;

      const { data } = await api.post("/digital-id/verify", { idCode });
      setResult(data);
    } catch (err) {
      setResult({ valid: false, reason: err.response?.data?.message || "Error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 480 }}>
      <h2>Verify Digital ID</h2>
      <div className="card">
        <form onSubmit={verify}>
          <label>ID code (or pasted QR content)</label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="STID-XXXXXXXXXX"
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? "Checking…" : "Verify"}
          </button>
        </form>

        {result && (
          <div
            style={{
              marginTop: 16,
              padding: 16,
              borderRadius: 8,
              background: result.valid ? "#e8f7ee" : "#fdeaea",
            }}
          >
            <h3 style={{ margin: 0 }}>
              {result.valid ? "✅ VALID" : "❌ NOT VALID"}
            </h3>
            {result.tourist && (
              <p style={{ margin: "8px 0 0" }}>
                <b>{result.tourist.name}</b> ({result.tourist.email})
                <br />
                Status: {result.status}
                <br />
                Valid until:{" "}
                {result.validUntil &&
                  new Date(result.validUntil).toLocaleDateString()}
              </p>
            )}
            {result.reason && <p style={{ margin: "8px 0 0" }}>{result.reason}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
