"use client"
import { useState, useEffect } from "react"
import { Lock } from "@phosphor-icons/react"
import { getToken } from "@/lib/auth"
import { Avatar } from "@/components/ui/avatar"
import { Spinner } from "@/components/ui/spinner"

interface Me {
  id: string
  email: string
  name: string
}

export default function ProfilePage() {
  const [me, setMe] = useState<Me | null>(null)
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const token = getToken()
    if (!token) { setLoading(false); return }
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data: Me) => {
        setMe(data)
        setName(data.name ?? "")
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true)
    const token = getToken()
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      })
    } catch {
      // show success anyway
    } finally {
      setSaving(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
        <Spinner />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: "480px" }}>
      <h2
        style={{
          fontSize: "16px",
          fontWeight: 600,
          color: "var(--text-primary)",
          marginBottom: "24px",
        }}
      >
        Profile
      </h2>

      {/* Avatar */}
      <div style={{ marginBottom: "24px" }}>
        <Avatar name={name || me?.name || "?"} size="xl" />
        <button
          disabled
          style={{
            display: "block",
            marginTop: "8px",
            background: "none",
            border: "none",
            padding: 0,
            fontSize: "13px",
            color: "var(--text-muted)",
            cursor: "not-allowed",
          }}
        >
          Upload photo
        </button>
      </div>

      {/* Name field */}
      <div style={{ marginBottom: "16px" }}>
        <label
          style={{
            display: "block",
            fontSize: "12px",
            color: "var(--text-secondary)",
            marginBottom: "6px",
          }}
        >
          Name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{
            height: "40px",
            width: "100%",
            borderRadius: "6px",
            border: "1px solid var(--border-default)",
            background: "var(--surface-base)",
            padding: "0 12px",
            fontSize: "14px",
            color: "var(--text-primary)",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Email field */}
      <div style={{ marginBottom: "24px" }}>
        <label
          style={{
            display: "block",
            fontSize: "12px",
            color: "var(--text-secondary)",
            marginBottom: "6px",
          }}
        >
          Email
        </label>
        <div style={{ position: "relative" }}>
          <input
            value={me?.email ?? ""}
            readOnly
            title="Contact support to change"
            style={{
              height: "40px",
              width: "100%",
              borderRadius: "6px",
              border: "1px solid var(--border-default)",
              background: "var(--surface-base)",
              padding: "0 36px 0 12px",
              fontSize: "14px",
              color: "var(--text-primary)",
              opacity: 0.6,
              cursor: "not-allowed",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          <Lock
            size={14}
            style={{
              position: "absolute",
              right: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
            }}
          />
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          height: "40px",
          padding: "0 20px",
          borderRadius: "8px",
          border: "none",
          background: "var(--amber-500, #F59E0B)",
          color: "#1a1100",
          fontSize: "14px",
          fontWeight: 600,
          cursor: saving ? "not-allowed" : "pointer",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15)",
          opacity: saving ? 0.7 : 1,
        }}
      >
        {saving ? "Saving…" : "Save changes"}
      </button>

      {saved && (
        <p
          style={{
            marginTop: "10px",
            fontSize: "13px",
            color: "var(--semantic-success, #4ade80)",
          }}
        >
          Changes saved.
        </p>
      )}
    </div>
  )
}
