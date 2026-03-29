"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState } from "react"

const CYCLE_MS = 2500

const fadeSlide = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.3 },
}

function ClauseView() {
  return (
    <motion.div {...fadeSlide}>
      <p
        style={{
          fontSize: "10px",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--text-muted)",
          marginBottom: "12px",
          marginTop: 0,
        }}
      >
        SECTION 8.2 — TERMINATION
      </p>
      <p
        style={{
          fontSize: "14px",
          lineHeight: 1.7,
          color: "var(--text-secondary)",
          margin: 0,
        }}
      >
        &ldquo;Either party may terminate this Agreement upon{" "}
        <span
          style={{
            background: "rgba(200,169,110,0.2)",
            borderBottom: "1px solid var(--accent-gold)",
            padding: "1px 2px",
            color: "var(--text-primary)",
          }}
        >
          30 days written notice
        </span>{" "}
        without cause. The Company may terminate immediately upon material
        breach.&rdquo;
      </p>
    </motion.div>
  )
}

function AnalysisView() {
  return (
    <motion.div {...fadeSlide}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        <p
          style={{
            fontSize: "10px",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
            margin: 0,
          }}
        >
          TERMINATION
        </p>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "2px 8px",
            borderRadius: "9999px",
            border: "1px solid var(--risk-high)",
            color: "var(--risk-high)",
            background: "rgba(224,140,48,0.1)",
            fontSize: "10px",
            fontWeight: 600,
          }}
        >
          HIGH RISK
        </span>
      </div>
      <p
        style={{
          fontSize: "13px",
          lineHeight: 1.7,
          color: "var(--text-secondary)",
          marginBottom: "12px",
          marginTop: 0,
        }}
      >
        Unilateral termination with 30-day notice and no cure period.
        Counterparty can exit without reason.
      </p>
      <div
        style={{
          background: "var(--surface-base)",
          borderRadius: "6px",
          padding: "10px 12px",
          borderLeft: "2px solid var(--accent-gold)",
        }}
      >
        <p
          style={{
            fontSize: "11px",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "var(--accent-gold)",
            marginBottom: "4px",
            marginTop: 0,
          }}
        >
          Recommendation
        </p>
        <p
          style={{
            fontSize: "12px",
            color: "var(--text-secondary)",
            margin: 0,
          }}
        >
          Negotiate minimum 60-day notice + cure period for non-material
          breaches.
        </p>
      </div>
    </motion.div>
  )
}

function ChatView() {
  return (
    <motion.div
      {...fadeSlide}
      style={{ display: "flex", flexDirection: "column", gap: "10px" }}
    >
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <div
          style={{
            background: "rgba(200,169,110,0.12)",
            borderRadius: "12px 12px 0 12px",
            padding: "10px 14px",
            maxWidth: "80%",
            fontSize: "13px",
            color: "var(--text-primary)",
          }}
        >
          What should I negotiate in this clause?
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-start" }}>
        <div
          style={{
            background: "var(--surface-overlay)",
            borderRadius: "12px 12px 12px 0",
            padding: "10px 14px",
            maxWidth: "85%",
            fontSize: "13px",
            color: "var(--text-secondary)",
            lineHeight: 1.6,
          }}
        >
          The 30-day notice is short with no reciprocal cure period. Push for 60
          days minimum and require written notice of breach with a 15-day
          opportunity to cure before termination triggers.
        </div>
      </div>
    </motion.div>
  )
}

export function LiveDemo() {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const interval = setInterval(
      () => setStep((s) => (s + 1) % 3),
      CYCLE_MS
    )
    return () => clearInterval(interval)
  }, [])

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "720px",
        borderRadius: "16px",
        border: "1px solid var(--border-subtle)",
        background: "var(--surface-elevated)",
        overflow: "hidden",
        boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
      }}
    >
      {/* Window chrome */}
      <div
        style={{
          height: "44px",
          background: "var(--surface-overlay)",
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          gap: "6px",
        }}
      >
        {(["#FF5F56", "#FFBD2E", "#27C93F"] as const).map((c, i) => (
          <span
            key={i}
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: c,
              opacity: 0.7,
              display: "inline-block",
            }}
          />
        ))}
        <span
          style={{
            marginLeft: "auto",
            fontSize: "11px",
            color: "var(--text-muted)",
          }}
        >
          contract-analysis.pdf
        </span>
      </div>

      {/* Content */}
      <div
        style={{ padding: "24px", minHeight: "180px", position: "relative" }}
      >
        <AnimatePresence mode="wait">
          {step === 0 && <ClauseView key="clause" />}
          {step === 1 && <AnalysisView key="analysis" />}
          {step === 2 && <ChatView key="chat" />}
        </AnimatePresence>
      </div>

      {/* Progress dots */}
      <div
        style={{
          padding: "12px 24px",
          display: "flex",
          gap: "6px",
          borderTop: "1px solid var(--border-subtle)",
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              height: "3px",
              flex: 1,
              borderRadius: "2px",
              background:
                i === step ? "var(--accent-gold)" : "var(--surface-overlay)",
              transition: "background 300ms",
            }}
          />
        ))}
      </div>
    </div>
  )
}
