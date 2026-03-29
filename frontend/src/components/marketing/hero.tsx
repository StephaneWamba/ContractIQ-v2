"use client"

import Link from "next/link"
import { LiveDemo } from "./live-demo"

export function Hero() {
  return (
    <section
      className="dot-grid"
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: "160px",
        paddingBottom: "160px",
        paddingInline: "24px",
        overflow: "hidden",
      }}
    >
      {/* Radial amber glow */}
      <div
        style={{
          position: "absolute",
          top: "-200px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "800px",
          height: "600px",
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse, rgba(200,169,110,0.06) 0%, transparent 70%)",
          filter: "blur(80px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Content */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Eyebrow */}
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "4px 12px",
            borderRadius: "9999px",
            border: "1px solid rgba(200,169,110,0.3)",
            background: "rgba(200,169,110,0.06)",
            fontSize: "10px",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--accent-gold)",
            marginBottom: "24px",
          }}
        >
          Contract analysis for founders
        </span>

        {/* Headline */}
        <h1
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "clamp(40px, 5vw, 68px)",
            lineHeight: 1.1,
            fontWeight: 400,
            color: "var(--text-primary)",
            marginBottom: "24px",
            marginTop: 0,
            textAlign: "center",
            maxWidth: "720px",
          }}
        >
          Every clause.
          <br />
          Every risk.
          <br />
          Negotiated.
        </h1>

        {/* Subtext */}
        <p
          style={{
            fontSize: "18px",
            color: "var(--text-secondary)",
            maxWidth: "520px",
            textAlign: "center",
            lineHeight: 1.6,
            marginBottom: "40px",
            marginTop: 0,
          }}
        >
          Upload any contract. ContractIQ extracts every clause, assigns risk
          levels, and answers your questions — in seconds.
        </p>

        {/* CTAs */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "80px" }}>
          <Link
            href="/register"
            style={{
              height: "44px",
              paddingInline: "24px",
              borderRadius: "8px",
              background: "var(--accent-gold)",
              color: "#0C0C0E",
              display: "inline-flex",
              alignItems: "center",
              fontSize: "15px",
              fontWeight: 500,
              textDecoration: "none",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18)",
            }}
          >
            Analyze a contract →
          </Link>
          <Link
            href="/login"
            style={{
              height: "44px",
              paddingInline: "24px",
              borderRadius: "8px",
              border: "1px solid var(--border-default)",
              background: "transparent",
              color: "var(--text-secondary)",
              display: "inline-flex",
              alignItems: "center",
              fontSize: "15px",
              textDecoration: "none",
            }}
          >
            Sign in
          </Link>
        </div>

        {/* Live demo */}
        <LiveDemo />
      </div>
    </section>
  )
}
