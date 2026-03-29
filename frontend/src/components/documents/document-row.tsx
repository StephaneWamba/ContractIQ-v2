"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { FilePdf, DotsThreeOutline } from "@phosphor-icons/react"
import { StatusBadge, ContractTypeBadge } from "@/components/ui/badge"
import type { Document } from "@/hooks/use-documents"
import { getToken } from "@/lib/auth"

function formatContractType(type: string): string {
  return type
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ")
    .replace("Saas", "SaaS")
    .replace("Nda", "NDA")
    .replace("Msa", "MSA")
    .replace("Sow", "SOW")
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

interface DocumentRowProps {
  doc: Document
  workspaceId: string
  onDeleted: () => void
}

export function DocumentRow({ doc, workspaceId, onDeleted }: DocumentRowProps) {
  const router = useRouter()
  const [hovered, setHovered] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const badgeStatus: "processing" | "ready" | "failed" =
    doc.status === "pending" || doc.status === "processing"
      ? "processing"
      : doc.status === "failed"
      ? "failed"
      : "ready"

  async function handleDelete() {
    setDeleting(true)
    const token = getToken()
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/documents/${doc.id}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
      )
      onDeleted()
    } catch {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  if (confirmDelete) {
    return (
      <div
        style={{
          height: "52px",
          borderRadius: "8px",
          padding: "0 12px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          background: "rgba(224,82,82,0.08)",
          border: "1px solid rgba(224,82,82,0.2)",
        }}
      >
        <span style={{ fontSize: "13px", color: "var(--text-secondary)", flex: 1 }}>
          Delete this document?
        </span>
        <button
          onClick={handleDelete}
          disabled={deleting}
          style={{
            height: "26px",
            paddingInline: "12px",
            borderRadius: "5px",
            fontSize: "12px",
            fontWeight: 500,
            cursor: deleting ? "not-allowed" : "pointer",
            border: "none",
            background: "#E05252",
            color: "#fff",
          }}
        >
          {deleting ? "Deleting..." : "Confirm"}
        </button>
        <button
          onClick={() => setConfirmDelete(false)}
          style={{
            height: "26px",
            paddingInline: "12px",
            borderRadius: "5px",
            fontSize: "12px",
            fontWeight: 500,
            cursor: "pointer",
            border: "1px solid var(--border-default)",
            background: "transparent",
            color: "var(--text-secondary)",
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
        height: "52px",
        borderRadius: "8px",
        padding: "0 12px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        cursor: "pointer",
        background: hovered ? "var(--surface-elevated)" : "transparent",
        transition: "background 120ms ease",
        position: "relative",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setMenuOpen(false) }}
      onClick={() => router.push(`/documents/${doc.id}`)}
    >
      {/* File icon */}
      <div style={{ width: "32px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <FilePdf size={20} color="var(--text-muted)" />
      </div>

      {/* Filename */}
      <div
        style={{
          width: "160px",
          fontSize: "14px",
          fontWeight: 600,
          color: "var(--text-primary)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        {doc.filename}
      </div>

      {/* Contract type */}
      <div style={{ width: "120px", flexShrink: 0 }}>
        <ContractTypeBadge type={formatContractType(doc.contract_type)} />
      </div>

      {/* Status */}
      <div style={{ width: "100px", flexShrink: 0 }}>
        <StatusBadge status={badgeStatus} />
      </div>

      <div style={{ width: "60px", flexShrink: 0 }} />

      {/* Date */}
      <div
        style={{
          width: "80px",
          fontSize: "12px",
          color: "var(--text-muted)",
          flexShrink: 0,
        }}
      >
        {formatDate(doc.created_at)}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Menu button */}
      {hovered && (
        <div style={{ position: "relative", width: "32px", flexShrink: 0 }}>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setMenuOpen((o) => !o)
            }}
            style={{
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              borderRadius: "4px",
              color: "var(--text-muted)",
            }}
          >
            <DotsThreeOutline size={16} />
          </button>

          {menuOpen && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "100%",
                zIndex: 50,
                background: "var(--surface-elevated)",
                border: "1px solid var(--border-default)",
                borderRadius: "8px",
                padding: "4px",
                minWidth: "140px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {[
                {
                  label: "View",
                  onClick: () => router.push(`/documents/${doc.id}`),
                },
                {
                  label: "Download PDF",
                  onClick: () => router.push(`/documents/${doc.id}`),
                },
                {
                  label: "Delete",
                  danger: true,
                  onClick: () => {
                    setMenuOpen(false)
                    setConfirmDelete(true)
                  },
                },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "7px 12px",
                    borderRadius: "5px",
                    fontSize: "13px",
                    cursor: "pointer",
                    border: "none",
                    background: "transparent",
                    color: item.danger ? "#E05252" : "var(--text-primary)",
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
