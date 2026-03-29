"use client"

import Link from "next/link"
import { useState, useEffect } from "react"

export function Nav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handler, { passive: true })
    return () => window.removeEventListener("scroll", handler)
  }, [])

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        height: "60px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 48px",
        background: scrolled ? "rgba(12, 12, 14, 0.85)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? "1px solid var(--border-subtle)" : "none",
        transition: "background 200ms, border-color 200ms",
      }}
    >
      <Link
        href="/"
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: "18px",
          color: "var(--accent-gold)",
          textDecoration: "none",
        }}
      >
        ContractIQ
      </Link>
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <Link
          href="/login"
          style={{
            fontSize: "14px",
            color: "var(--text-secondary)",
            textDecoration: "none",
          }}
        >
          Sign in
        </Link>
        <Link
          href="/register"
          style={{
            display: "inline-flex",
            alignItems: "center",
            height: "36px",
            paddingInline: "16px",
            borderRadius: "6px",
            background: "var(--accent-gold)",
            color: "#0C0C0E",
            fontSize: "13px",
            fontWeight: 500,
            textDecoration: "none",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18)",
          }}
        >
          Get started →
        </Link>
      </div>
    </nav>
  )
}
