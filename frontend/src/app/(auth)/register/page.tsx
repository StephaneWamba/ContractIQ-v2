"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeSlash } from "@phosphor-icons/react"
import { registerUser, setToken } from "@/lib/auth"
import { Spinner } from "@/components/ui/spinner"
import { FormField } from "@/components/auth/form-field"

function getStrengthColor(score: number): string {
  if (score <= 1) return "var(--semantic-error)"
  if (score === 2) return "var(--semantic-warning)"
  if (score === 3) return "rgba(200,169,110,0.7)"
  return "var(--semantic-success)"
}

function PasswordStrengthBar({ password }: { password: string }) {
  if (!password.length) return null

  // Compute strength score client-side only
  let score = 0
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const zxcvbn = require("zxcvbn")
    score = (zxcvbn.default || zxcvbn)(password).score as number
  } catch {
    // fallback: rough length-based score
    score = Math.min(Math.floor(password.length / 4), 4)
  }

  const lit = score === 0 ? 1 : score
  const color = getStrengthColor(score)

  return (
    <div
      style={{
        display: "flex",
        gap: "4px",
        marginTop: "8px",
      }}
    >
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: "3px",
            borderRadius: "2px",
            backgroundColor: i < lit ? color : "var(--surface-overlay)",
            transition: "background-color 200ms ease",
          }}
        />
      ))}
    </div>
  )
}

export default function RegisterPage() {
  const router = useRouter()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [emailError, setEmailError] = useState("")
  const [formError, setFormError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setEmailError("")
    setFormError("")
    setLoading(true)

    try {
      const token = await registerUser(email, password, name)
      setToken(token)
      router.push("/app/dashboard?onboarding=true")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed"
      if (message.toLowerCase().includes("already") || message.toLowerCase().includes("email")) {
        setEmailError(message)
      } else {
        setFormError(message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Eyebrow */}
      <p
        style={{
          fontSize: "10px",
          letterSpacing: "0.15em",
          color: "var(--text-muted)",
          textTransform: "uppercase",
          marginBottom: "12px",
        }}
      >
        Get Started
      </p>

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
        Create your account
      </h1>

      {/* Subtext */}
      <p
        style={{
          fontSize: "14px",
          color: "var(--text-secondary)",
          marginBottom: "32px",
        }}
      >
        Review any contract in minutes.
      </p>

      {/* Full name */}
      <div style={{ marginBottom: "16px" }}>
        <FormField
          label="Full name"
          id="name"
          type="text"
          value={name}
          onChange={setName}
          autoComplete="name"
          disabled={loading}
        />
      </div>

      {/* Work email */}
      <div style={{ marginBottom: "16px" }}>
        <FormField
          label="Work email"
          id="email"
          type="email"
          value={email}
          onChange={(v) => {
            setEmail(v)
            if (emailError) setEmailError("")
          }}
          autoComplete="email"
          disabled={loading}
          error={
            emailError
              ? undefined // rendered manually below for the special link case
              : undefined
          }
        />
        {emailError && (
          <p style={{ fontSize: "12px", color: "var(--semantic-error)", marginTop: "6px" }}>
            This email is already registered.{" "}
            <Link href="/login" style={{ color: "var(--semantic-error)", textDecoration: "underline" }}>
              Sign in?
            </Link>
          </p>
        )}
      </div>

      {/* Password */}
      <div style={{ marginBottom: "24px" }}>
        <FormField
          label="Password"
          id="password"
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          disabled={loading}
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
                display: "flex",
                alignItems: "center",
                padding: 0,
              }}
              tabIndex={-1}
            >
              {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
            </button>
          }
        />
        <PasswordStrengthBar password={password} />
      </div>

      {/* Form-level error */}
      {formError && (
        <p style={{ fontSize: "12px", color: "var(--semantic-error)", marginBottom: "12px" }}>
          {formError}
        </p>
      )}

      {/* Submit button */}
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
        {loading ? <Spinner /> : "Create account"}
      </button>

      {/* Legal note */}
      <p
        style={{
          fontSize: "11px",
          color: "var(--text-muted)",
          textAlign: "center",
          marginTop: "12px",
          lineHeight: "1.5",
        }}
      >
        By continuing, you agree to the{" "}
        <Link
          href="/terms"
          style={{ color: "var(--text-muted)", textDecoration: "none" }}
          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
        >
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link
          href="/privacy"
          style={{ color: "var(--text-muted)", textDecoration: "none" }}
          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
        >
          Privacy Policy
        </Link>
        .
      </p>

      {/* Footer link */}
      <p
        style={{
          textAlign: "center",
          fontSize: "14px",
          color: "var(--text-secondary)",
          marginTop: "24px",
        }}
      >
        Already have an account?{" "}
        <Link href="/login" style={{ color: "var(--accent-gold)", textDecoration: "none" }}>
          Sign in →
        </Link>
      </p>
    </form>
  )
}
