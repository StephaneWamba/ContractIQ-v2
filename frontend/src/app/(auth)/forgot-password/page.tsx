"use client"

import { useState } from "react"
import Link from "next/link"
import { CaretLeft, EnvelopeOpen } from "@phosphor-icons/react"
import { AnimatePresence, motion } from "framer-motion"
import { Spinner } from "@/components/ui/spinner"
import { FormField } from "@/components/auth/form-field"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    setError("")
    setLoading(true)

    try {
      // Backend endpoint not yet implemented — simulate request
      await new Promise((r) => setTimeout(r, 1000))
      setSent(true)
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    setError("")
    setLoading(true)
    try {
      await new Promise((r) => setTimeout(r, 1000))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <AnimatePresence mode="wait">
        {!sent ? (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Back link */}
            <Link
              href="/login"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "14px",
                color: "var(--text-muted)",
                textDecoration: "none",
                marginBottom: "24px",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
            >
              <CaretLeft size={14} />
              Back to sign in
            </Link>

            {/* Headline */}
            <h1
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "28px",
                color: "var(--text-primary)",
                marginBottom: "8px",
                lineHeight: "1.2",
              }}
            >
              Reset your password
            </h1>

            {/* Body text */}
            <p
              style={{
                fontSize: "14px",
                color: "var(--text-secondary)",
                marginBottom: "32px",
              }}
            >
              Enter your email and we&apos;ll send you a reset link.
            </p>

            <form onSubmit={handleSubmit} noValidate>
              <div style={{ marginBottom: "24px" }}>
                <FormField
                  label="Email"
                  id="email"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  autoComplete="email"
                  disabled={loading}
                  error={error}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                  height: "40px",
                  borderRadius: "6px",
                  background: "var(--accent-gold)",
                  color: "#0C0C0E",
                  fontSize: "14px",
                  fontWeight: 500,
                  border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.5 : 1,
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18)",
                  transition: "filter 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.filter = "brightness(1.08)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.filter = "none"
                }}
              >
                {loading ? <Spinner /> : "Send reset link"}
              </button>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ textAlign: "center" }}
          >
            <EnvelopeOpen
              size={32}
              style={{ color: "var(--accent-gold)", marginBottom: "16px" }}
            />

            <h1
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "28px",
                color: "var(--text-primary)",
                marginBottom: "8px",
                lineHeight: "1.2",
              }}
            >
              Check your email
            </h1>

            <p
              style={{
                fontSize: "14px",
                color: "var(--text-secondary)",
                marginBottom: "24px",
                lineHeight: "1.6",
              }}
            >
              We sent a reset link to <strong style={{ color: "var(--text-primary)" }}>{email}</strong>.
              It expires in 15 minutes.
            </p>

            <button
              type="button"
              onClick={handleResend}
              disabled={loading}
              style={{
                background: "none",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "14px",
                color: "var(--accent-gold)",
                textDecoration: "underline",
                opacity: loading ? 0.5 : 1,
                padding: 0,
              }}
            >
              {loading ? <Spinner /> : "Didn't receive it? Send again"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
