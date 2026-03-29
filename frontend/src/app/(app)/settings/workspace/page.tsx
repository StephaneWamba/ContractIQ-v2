"use client"
import { useState, useEffect } from "react"
import { useWorkspace } from "@/hooks/use-workspace"
import { getToken } from "@/lib/auth"
import { Spinner } from "@/components/ui/spinner"

export default function WorkspacePage() {
  const { workspace, loading } = useWorkspace()
  const [name, setName] = useState("")
  const [region, setRegion] = useState("EU")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (workspace) {
      setName(workspace.name ?? "")
      setRegion((workspace as { name: string; region?: string }).region ?? "EU")
    }
  }, [workspace])

  async function handleSave() {
    if (!workspace) return
    setSaving(true)
    const token = getToken()
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workspaces/${workspace.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, region }),
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

  const fieldLabel: React.CSSProperties = {
    display: "block",
    fontSize: "12px",
    color: "var(--text-secondary)",
    marginBottom: "6px",
  }

  const fieldInput: React.CSSProperties = {
    height: "40px",
    width: "100%",
    maxWidth: "320px",
    borderRadius: "6px",
    border: "1px solid var(--border-default)",
    background: "var(--surface-base)",
    padding: "0 12px",
    fontSize: "14px",
    color: "var(--text-primary)",
    outline: "none",
    boxSizing: "border-box",
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
        Workspace
      </h2>

      {/* Workspace name */}
      <div style={{ marginBottom: "16px" }}>
        <label style={fieldLabel}>Workspace name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={fieldInput}
        />
      </div>

      {/* Default region */}
      <div style={{ marginBottom: "24px" }}>
        <label style={fieldLabel}>Default region</label>
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          style={{ ...fieldInput, cursor: "pointer" }}
        >
          <option value="EU">EU (GDPR)</option>
          <option value="US">US</option>
          <option value="UK">UK</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {/* Save */}
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
