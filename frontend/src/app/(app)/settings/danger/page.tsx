"use client"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { useWorkspace } from "@/hooks/use-workspace"
import { getToken, clearToken } from "@/lib/auth"
import { useRouter } from "next/navigation"

interface DangerActionProps {
  title: string
  description: string
  buttonLabel: string
  confirmWord: string
  onConfirm: () => Promise<void>
  variant: "outline" | "filled"
}

function DangerAction({
  title,
  description,
  buttonLabel,
  confirmWord,
  onConfirm,
  variant,
}: DangerActionProps) {
  const [confirming, setConfirming] = useState(false)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!confirming) return
    const t = setTimeout(() => {
      setConfirming(false)
      setInput("")
    }, 10000)
    return () => clearTimeout(t)
  }, [confirming])

  if (confirming) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
        <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
          Type DELETE to confirm:
        </span>
        <input
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="DELETE"
          style={{
            height: "32px",
            borderRadius: "6px",
            border: "1px solid var(--border-default)",
            background: "var(--surface-base)",
            padding: "0 8px",
            fontSize: "13px",
            width: "100px",
            color: "var(--text-primary)",
            outline: "none",
          }}
        />
        <button
          disabled={input !== confirmWord || loading}
          onClick={async () => {
            setLoading(true)
            await onConfirm()
            setLoading(false)
            setConfirming(false)
            setInput("")
          }}
          style={{
            height: "32px",
            padding: "0 12px",
            borderRadius: "6px",
            background: "var(--semantic-error)",
            color: "white",
            border: "none",
            fontSize: "13px",
            cursor: input !== confirmWord ? "not-allowed" : "pointer",
            opacity: input !== confirmWord ? 0.5 : 1,
          }}
        >
          {loading ? "..." : "Confirm"}
        </button>
        <button
          onClick={() => {
            setConfirming(false)
            setInput("")
          }}
          style={{
            height: "32px",
            padding: "0 12px",
            borderRadius: "6px",
            border: "1px solid var(--border-default)",
            background: "transparent",
            color: "var(--text-secondary)",
            fontSize: "13px",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "16px",
      }}
    >
      <div>
        <p
          style={{
            fontSize: "14px",
            fontWeight: 500,
            color: "var(--text-primary)",
            marginBottom: "4px",
          }}
        >
          {title}
        </p>
        <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{description}</p>
      </div>
      <button
        onClick={() => setConfirming(true)}
        style={{
          flexShrink: 0,
          height: "36px",
          padding: "0 14px",
          borderRadius: "6px",
          border: variant === "filled" ? "none" : "1px solid var(--semantic-error)",
          background: variant === "filled" ? "var(--semantic-error)" : "transparent",
          color: variant === "filled" ? "white" : "var(--semantic-error)",
          fontSize: "13px",
          cursor: "pointer",
          fontWeight: 500,
        }}
      >
        {buttonLabel}
      </button>
    </div>
  )
}

export default function DangerPage() {
  const { workspace } = useWorkspace()
  const router = useRouter()

  async function handleDeleteAll() {
    const token = getToken()
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/workspaces/${workspace?.id}/documents`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      if (!res.ok) throw new Error("Failed")
    } catch {
      toast.error("Error deleting documents")
    }
  }

  async function handleDeleteWorkspace() {
    const token = getToken()
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/workspaces/${workspace?.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      if (!res.ok) throw new Error("Failed")
      clearToken()
      router.push("/login")
    } catch {
      toast.error("Error deleting workspace")
    }
  }

  return (
    <div>
      <h2
        style={{
          fontSize: "16px",
          fontWeight: 600,
          color: "var(--text-primary)",
          marginBottom: "24px",
        }}
      >
        Danger zone
      </h2>

      <div
        style={{
          border: "1px solid rgba(224, 82, 82, 0.3)",
          borderRadius: "10px",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <DangerAction
          title="Delete all documents"
          description="Permanently delete all documents and their analysis from your workspace."
          buttonLabel="Delete all documents"
          confirmWord="DELETE"
          onConfirm={handleDeleteAll}
          variant="outline"
        />
        <div style={{ height: "1px", background: "var(--border-subtle)" }} />
        <DangerAction
          title="Delete workspace"
          description="Permanently delete your workspace, all documents, and your account."
          buttonLabel="Delete workspace"
          confirmWord="DELETE"
          onConfirm={handleDeleteWorkspace}
          variant="filled"
        />
      </div>
    </div>
  )
}
