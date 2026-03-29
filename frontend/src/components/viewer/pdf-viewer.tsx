"use client"
import dynamic from "next/dynamic"
import { useState, useEffect } from "react"
import { CaretLeft, CaretRight, Minus, Plus, DownloadSimple } from "@phosphor-icons/react"
import { Spinner } from "@/components/ui/spinner"
import type { Clause } from "@/hooks/use-document-detail"

const PDFDocumentDynamic = dynamic(
  () => import("react-pdf").then((m) => ({ default: m.Document })),
  { ssr: false }
)
const PDFPageDynamic = dynamic(
  () => import("react-pdf").then((m) => ({ default: m.Page })),
  { ssr: false }
)

const ZOOM_LEVELS = [75, 100, 125, 150, 200]
const BASE_WIDTH = 640

interface Props {
  pdfUrl: string | null
  selectedClause: Clause | null
}

export function PdfViewer({ pdfUrl, selectedClause }: Props) {
  const [numPages, setNumPages] = useState(0)
  const [page, setPage] = useState(1)
  const [zoomIndex, setZoomIndex] = useState(1)
  const [pageInput, setPageInput] = useState("1")
  const [pdfError, setPdfError] = useState(false)

  const zoom = ZOOM_LEVELS[zoomIndex]

  useEffect(() => {
    import("react-pdf").then(({ pdfjs }) => {
      pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`
    })
  }, [])

  const goTo = (n: number) => {
    const clamped = Math.max(1, Math.min(n, numPages || 1))
    setPage(clamped)
    setPageInput(String(clamped))
  }

  if (!pdfUrl || pdfError) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          color: "var(--text-muted)",
          fontSize: "14px",
        }}
      >
        PDF preview not available
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
      {/* Toolbar */}
      <div
        style={{
          padding: "8px 16px",
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          flexShrink: 0,
          background: "var(--surface-elevated)",
        }}
      >
        {/* Pagination */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <button
            onClick={() => goTo(page - 1)}
            disabled={page <= 1}
            style={{
              background: "transparent",
              border: "none",
              cursor: page <= 1 ? "default" : "pointer",
              color: page <= 1 ? "var(--text-muted)" : "var(--text-secondary)",
              padding: "4px",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <CaretLeft size={14} />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--text-secondary)" }}>
            <span>Page</span>
            <input
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              onBlur={() => goTo(parseInt(pageInput) || 1)}
              onKeyDown={(e) => {
                if (e.key === "Enter") goTo(parseInt(pageInput) || 1)
              }}
              style={{
                width: "36px",
                textAlign: "center",
                background: "var(--surface-base)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "4px",
                color: "var(--text-primary)",
                fontSize: "12px",
                padding: "2px 4px",
              }}
            />
            <span>/ {numPages || "—"}</span>
          </div>
          <button
            onClick={() => goTo(page + 1)}
            disabled={page >= numPages}
            style={{
              background: "transparent",
              border: "none",
              cursor: page >= numPages ? "default" : "pointer",
              color: page >= numPages ? "var(--text-muted)" : "var(--text-secondary)",
              padding: "4px",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <CaretRight size={14} />
          </button>
        </div>

        <div style={{ flex: 1 }} />

        {/* Zoom */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <button
            onClick={() => setZoomIndex((i) => Math.max(0, i - 1))}
            disabled={zoomIndex === 0}
            style={{
              background: "transparent",
              border: "none",
              cursor: zoomIndex === 0 ? "default" : "pointer",
              color: zoomIndex === 0 ? "var(--text-muted)" : "var(--text-secondary)",
              padding: "4px",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Minus size={14} />
          </button>
          <span style={{ fontSize: "12px", color: "var(--text-secondary)", minWidth: "38px", textAlign: "center" }}>
            {zoom}%
          </span>
          <button
            onClick={() => setZoomIndex((i) => Math.min(ZOOM_LEVELS.length - 1, i + 1))}
            disabled={zoomIndex === ZOOM_LEVELS.length - 1}
            style={{
              background: "transparent",
              border: "none",
              cursor: zoomIndex === ZOOM_LEVELS.length - 1 ? "default" : "pointer",
              color: zoomIndex === ZOOM_LEVELS.length - 1 ? "var(--text-muted)" : "var(--text-secondary)",
              padding: "4px",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Plus size={14} />
          </button>
        </div>

        {/* Download */}
        <a
          href={pdfUrl}
          download
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            padding: "4px 10px",
            borderRadius: "6px",
            fontSize: "12px",
            color: "var(--text-secondary)",
            border: "1px solid var(--border-subtle)",
            textDecoration: "none",
            background: "transparent",
          }}
        >
          <DownloadSimple size={14} />
          Download
        </a>
      </div>

      {/* PDF Canvas Area */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "auto",
          display: "flex",
          justifyContent: "center",
          padding: "24px",
          background: "#1a1a1a",
        }}
      >
        <div style={{ position: "relative" }}>
          {selectedClause && (
            <div
              style={{
                position: "absolute",
                top: "8px",
                left: "8px",
                right: "8px",
                background: "rgba(200,169,110,0.15)",
                border: "1px solid rgba(200,169,110,0.3)",
                borderRadius: "4px",
                padding: "6px 10px",
                fontSize: "12px",
                color: "var(--accent-gold)",
                zIndex: 10,
              }}
            >
              Viewing: {selectedClause.clause_type.replace(/_/g, " ")}
            </div>
          )}
          <PDFDocumentDynamic
            file={pdfUrl}
            onLoadSuccess={({ numPages: n }) => {
              setNumPages(n)
              setPage(1)
              setPageInput("1")
            }}
            onLoadError={() => setPdfError(true)}
            loading={
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: `${BASE_WIDTH * (zoom / 100)}px`,
                  height: "800px",
                  color: "var(--text-muted)",
                }}
              >
                <Spinner />
              </div>
            }
          >
            <PDFPageDynamic
              pageNumber={page}
              width={BASE_WIDTH * (zoom / 100)}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </PDFDocumentDynamic>
        </div>
      </div>
    </div>
  )
}
