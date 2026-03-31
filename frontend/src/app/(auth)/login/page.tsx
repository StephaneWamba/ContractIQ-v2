"use client"

import { useState, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeSlash } from "@phosphor-icons/react"
import { loginUser, setToken } from "@/lib/auth"
import { Spinner } from "@/components/ui/spinner"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get("next") || "/dashboard"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const token = await loginUser(email, password)
      setToken(token)
      router.push(next)
    } catch {
      setError("Invalid email or password.")
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
        Welcome Back
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
        Sign in to ContractIQ
      </h1>

      {/* Subtext */}
      <p
        style={{
          fontSize: "14px",
          color: "var(--text-secondary)",
          marginBottom: "32px",
        }}
      >
        Your contracts, analyzed.
      </p>

      {/* Email field */}
      <div style={{ marginBottom: "16px" }}>
        <label
          htmlFor="email"
          style={{ display: "block", fontSize: "12px", color: "var(--text-secondary)", marginBottom: "6px" }}
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          disabled={loading}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            display: "block",
            width: "100%",
            height: "40px",
            borderRadius: "6px",
            border: "1px solid var(--border-default)",
            background: "var(--surface-base)",
            padding: "0 12px",
            fontSize: "14px",
            color: "var(--text-primary)",
            outline: "none",
            boxSizing: "border-box",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(200,169,110,0.6)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-default)")}
        />
      </div>

      {/* Password field */}
      <div style={{ marginBottom: "8px" }}>
        <label
          htmlFor="password"
          style={{ display: "block", fontSize: "12px", color: "var(--text-secondary)", marginBottom: "6px" }}
        >
          Password
        </label>
        <div style={{ position: "relative" }}>
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            disabled={loading}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              display: "block",
              width: "100%",
              height: "40px",
              borderRadius: "6px",
              border: error ? "1px solid var(--semantic-error)" : "1px solid var(--border-default)",
              background: "var(--surface-base)",
              padding: "0 40px 0 12px",
              fontSize: "14px",
              color: "var(--text-primary)",
              outline: "none",
              boxSizing: "border-box",
            }}
            onFocus={(e) => {
              if (!error) e.currentTarget.style.borderColor = "rgba(200,169,110,0.6)"
            }}
            onBlur={(e) => {
              if (!error) e.currentTarget.style.borderColor = "var(--border-default)"
            }}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            style={{
              position: "absolute",
              right: "12px",
              top: "50%",
              transform: "translateY(-50%)",
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
        </div>

        {/* Inline error */}
        {error && (
          <p style={{ fontSize: "12px", color: "var(--semantic-error)", marginTop: "6px" }}>{error}</p>
        )}
      </div>

      {/* Primary button */}
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
          marginTop: "24px",
          transition: "filter 0.15s",
        }}
        onMouseEnter={(e) => {
          if (!loading) e.currentTarget.style.filter = "brightness(1.08)"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.filter = "none"
        }}
      >
        {loading ? <Spinner /> : "Continue"}
      </button>

      {/* Divider */}
      <div className="relative my-6">
        <div style={{ height: "1px", background: "var(--border-subtle)" }} />
        <span
          className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 px-3"
          style={{ fontSize: "12px", color: "var(--text-muted)", background: "var(--bg-base)" }}
        >
          or
        </span>
      </div>

      {/* Google button */}
      <button
        type="button"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          width: "100%",
          height: "40px",
          borderRadius: "6px",
          border: "1px solid var(--border-default)",
          background: "transparent",
          color: "var(--text-secondary)",
          fontSize: "14px",
          cursor: "pointer",
        }}
      >
        {/* Google G SVG */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Sign in with Google
      </button>

      {/* Footer link */}
      <p
        style={{
          textAlign: "center",
          fontSize: "14px",
          color: "var(--text-secondary)",
          marginTop: "24px",
        }}
      >
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          style={{ color: "var(--accent-gold)", textDecoration: "none" }}
        >
          Register →
        </Link>
      </p>
    </form>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
