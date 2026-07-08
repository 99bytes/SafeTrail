import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Your Safety, Our Priority</h1>
          <p className="hero-subtitle">
            SafeTrail empowers tourists with real-time zone tracking, instant SOS alerts, and seamless communication with local authorities.
          </p>
          <div className="hero-actions">
            {user ? (
              <Link to={user.role === "authority" ? "/authority" : "/tourist"}>
                <button className="btn-primary hero-btn">Go to Dashboard</button>
              </Link>
            ) : (
              <>
                <Link to="/register">
                  <button className="btn-primary hero-btn">Get Started</button>
                </Link>
                <Link to="/login">
                  <button className="btn-secondary hero-btn">Login</button>
                </Link>
              </>
            )}
          </div>
        </div>
        <div className="hero-glow"></div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <h2 className="section-title">Why Choose SafeTrail?</h2>
          <div className="features-grid">
            <div className="feature-card glass-panel">
              <div className="feature-icon">🚨</div>
              <h3>Instant SOS</h3>
              <p>Trigger an emergency alert with your exact coordinates instantly.</p>
            </div>
            <div className="feature-card glass-panel">
              <div className="feature-icon">🗺️</div>
              <h3>Live Zone Tracking</h3>
              <p>Know exactly which areas are safe, cautious, or restricted in real-time.</p>
            </div>
            <div className="feature-card glass-panel">
              <div className="feature-icon">🆔</div>
              <h3>Digital Tourist ID</h3>
              <p>Carry a verifiable digital ID code on your device for seamless authority checks.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
