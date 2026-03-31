"use client"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Spinner } from "@/components/ui/spinner"
import { ClauseSidebar } from "@/components/viewer/clause-sidebar"
import { PdfViewer } from "@/components/viewer/pdf-viewer"
import { AnalysisPanel } from "@/components/viewer/analysis-panel"
import { useWorkspace } from "@/hooks/use-workspace"
import { useDocumentDetail } from "@/hooks/use-document-detail"

type MobileTab = "clauses" | "pdf" | "analysis"

export default function DocumentViewerPage() {
  const params = useParams()
  const documentId = params.id as string

  const { workspace } = useWorkspace()
  const workspaceId = workspace?.id ?? null

  const { document, clauses, analysis, pdfUrl, clauseLocations, loading } = useDocumentDetail(
    workspaceId,
    documentId
  )

  const [leftCollapsed, setLeftCollapsed] = useState(() => {
    if (typeof window === "undefined") return false
    return localStorage.getItem("viewer_left_collapsed") === "true"
  })
  const [rightCollapsed, setRightCollapsed] = useState(() => {
    if (typeof window === "undefined") return false
    return localStorage.getItem("viewer_right_collapsed") === "true"
  })
  const [selectedClauseId, setSelectedClauseId] = useState<string | null>(null)
  const [mobileTab, setMobileTab] = useState<MobileTab>("clauses")
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  useEffect(() => {
    localStorage.setItem("viewer_left_collapsed", String(leftCollapsed))
  }, [leftCollapsed])

  useEffect(() => {
    localStorage.setItem("viewer_right_collapsed", String(rightCollapsed))
  }, [rightCollapsed])

  const selectedClause = clauses.find((c) => c.id === selectedClauseId) ?? null

  const isProcessing =
    document?.status === "processing" || document?.status === "pending"

  const processingBanner = isProcessing && (
    <div
      style={{
        background: "rgba(200,169,110,0.08)",
        borderBottom: "1px solid rgba(200,169,110,0.2)",
        padding: "10px 16px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        flexShrink: 0,
      }}
    >
      <Spinner size="sm" />
      <span style={{ fontSize: "13px", color: "var(--accent-gold)" }}>
        Analyzing this contract — clauses will appear in 30–60 seconds
      </span>
    </div>
  )

  if (isMobile) {
    const tabs: { key: MobileTab; label: string }[] = [
      { key: "clauses", label: "Clauses" },
      { key: "pdf", label: "PDF" },
      { key: "analysis", label: "Analysis" },
    ]
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        {processingBanner}

        {/* Mobile tab bar */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid var(--border-subtle)",
            background: "var(--surface-elevated)",
            flexShrink: 0,
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setMobileTab(tab.key)}
              style={{
                flex: 1,
                padding: "10px 0",
                background: "transparent",
                border: "none",
                borderBottom: mobileTab === tab.key
                  ? "2px solid var(--accent-gold)"
                  : "2px solid transparent",
                cursor: "pointer",
                fontSize: "13px",
                color: mobileTab === tab.key ? "var(--accent-gold)" : "var(--text-muted)",
                fontWeight: mobileTab === tab.key ? 500 : 400,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, overflow: "hidden" }}>
          {mobileTab === "clauses" && (
            <ClauseSidebar
              clauses={clauses}
              loading={loading}
              selectedId={selectedClauseId}
              onSelect={(id) => { setSelectedClauseId(id); setMobileTab("pdf") }}
            />
          )}
          {mobileTab === "pdf" && (
            loading && !document ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-muted)" }}>
                <Spinner />
              </div>
            ) : (
              <PdfViewer pdfUrl={pdfUrl} selectedClause={selectedClause} clauseLocations={clauseLocations} />
            )
          )}
          {mobileTab === "analysis" && (
            <AnalysisPanel
              clauses={clauses}
              analysis={analysis}
              loading={loading}
              documentId={documentId}
              workspaceId={workspaceId}
              selectedClauseId={selectedClauseId}
              onSelectClause={setSelectedClauseId}
              documentStatus={document?.status}
            />
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        background: "var(--surface-base)",
      }}
    >
      {processingBanner}

      {/* Three-panel layout */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden", position: "relative" }}>
        {/* Left panel: Clause Sidebar */}
        {!leftCollapsed && (
          <ClauseSidebar
            clauses={clauses}
            loading={loading}
            selectedId={selectedClauseId}
            onSelect={setSelectedClauseId}
          />
        )}

        {/* Center: PDF Viewer */}
        <div style={{ flex: "0 0 560px", display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
          {/* Edge tab: show clauses */}
          {leftCollapsed && (
            <button
              onClick={() => setLeftCollapsed(false)}
              style={{
                position: "absolute",
                left: 0,
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 10,
                background: "var(--surface-elevated)",
                border: "1px solid var(--border-subtle)",
                borderLeft: "none",
                borderRadius: "0 6px 6px 0",
                padding: "8px 6px",
                cursor: "pointer",
                color: "var(--text-secondary)",
                fontSize: "11px",
                writingMode: "vertical-rl",
                textOrientation: "mixed",
                letterSpacing: "0.05em",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              ‹ Clauses
            </button>
          )}

          {/* PDF Viewer header with collapse buttons */}
          <div
            style={{
              padding: "6px 12px",
              borderBottom: "1px solid var(--border-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
              background: "var(--surface-elevated)",
            }}
          >
            <button
              onClick={() => setLeftCollapsed((v) => !v)}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
                fontSize: "12px",
                padding: "2px 6px",
              }}
            >
              {leftCollapsed ? "‹ Show Clauses" : "Hide Clauses ›"}
            </button>

            <span
              style={{
                fontSize: "13px",
                fontWeight: 500,
                color: "var(--text-primary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "400px",
              }}
            >
              {document?.filename ?? "Loading..."}
            </span>

            <button
              onClick={() => setRightCollapsed((v) => !v)}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
                fontSize: "12px",
                padding: "2px 6px",
              }}
            >
              {rightCollapsed ? "Show Analysis ›" : "‹ Hide Analysis"}
            </button>
          </div>

          {loading && !document ? (
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-muted)",
              }}
            >
              <Spinner />
            </div>
          ) : (
            <PdfViewer pdfUrl={pdfUrl} selectedClause={selectedClause} clauseLocations={clauseLocations} />
          )}

          {/* Edge tab: show analysis */}
          {rightCollapsed && (
            <button
              onClick={() => setRightCollapsed(false)}
              style={{
                position: "absolute",
                right: 0,
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 10,
                background: "var(--surface-elevated)",
                border: "1px solid var(--border-subtle)",
                borderRight: "none",
                borderRadius: "6px 0 0 6px",
                padding: "8px 6px",
                cursor: "pointer",
                color: "var(--text-secondary)",
                fontSize: "11px",
                writingMode: "vertical-rl",
                textOrientation: "mixed",
                letterSpacing: "0.05em",
              }}
            >
              Analysis ›
            </button>
          )}
        </div>

        {/* Right panel: Analysis Panel */}
        {!rightCollapsed && (
          <AnalysisPanel
            clauses={clauses}
            analysis={analysis}
            loading={loading}
            documentId={documentId}
            workspaceId={workspaceId}
            selectedClauseId={selectedClauseId}
            onSelectClause={setSelectedClauseId}
            documentStatus={document?.status}
          />
        )}
      </div>
    </div>
  )
}
