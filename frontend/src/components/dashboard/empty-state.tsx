"use client"
import Link from "next/link"
import { FileText } from "@phosphor-icons/react"

export function EmptyState() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "50vh",
        gap: "16px",
        textAlign: "center",
      }}
    >
      <FileText size={48} color="var(--accent-gold)" style={{ opacity: 0.6 }} />
      <div>
        <h2
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "24px",
            color: "var(--text-primary)",
            marginBottom: "8px",
          }}
        >
          Upload your first contract
        </h2>
        <p
          style={{
            fontSize: "14px",
            color: "var(--text-secondary)",
            maxWidth: "380px",
            lineHeight: "1.6",
          }}
        >
          Paste or drop any PDF — NDA, SaaS agreement, employment contract.
          ContractIQ extracts every clause, flags every risk, and lets you ask
          questions.
        </p>
      </div>
      <Link
        href="/documents/upload"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          height: "40px",
          paddingInline: "20px",
          borderRadius: "6px",
          background: "var(--accent-gold)",
          color: "#0C0C0E",
          fontSize: "14px",
          fontWeight: 500,
          textDecoration: "none",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18)",
        }}
      >
        Upload a contract →
      </Link>
      <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
        or drop a file anywhere on the screen
      </p>
    </div>
  )
}
