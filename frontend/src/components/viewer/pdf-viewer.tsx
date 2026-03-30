"use client"
import dynamic from "next/dynamic"
import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react"
import { CaretLeft, CaretRight, Minus, Plus, DownloadSimple } from "@phosphor-icons/react"
import { Spinner } from "@/components/ui/spinner"
import type { Clause, ClauseLocations, LocationEntry } from "@/hooks/use-document-detail"

const PDFDocumentDynamic = dynamic(
  () => import("react-pdf").then((m) => ({ default: m.Document })),
  { ssr: false }
)
const PDFPageDynamic = dynamic(
  () => import("react-pdf").then((m) => ({ default: m.Page })),
  { ssr: false }
)

const ZOOM_LEVELS = [75, 100, 125, 150, 200]
const BASE_WIDTH = 500

interface Props {
  pdfUrl: string | null
  selectedClause: Clause | null
  clauseLocations: ClauseLocations
}

export function PdfViewer({ pdfUrl, selectedClause, clauseLocations }: Props) {
  const [numPages, setNumPages] = useState(0)
  const [page, setPage] = useState(1)
  const [zoomIndex, setZoomIndex] = useState(1)
  const [pageInput, setPageInput] = useState("1")
  const [pdfError, setPdfError] = useState(false)
  // PDF page dimensions in points (from react-pdf onRenderSuccess)
  const [pageDims, setPageDims] = useState<{ width: number; height: number } | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const zoom = ZOOM_LEVELS[zoomIndex]
  const renderWidth = BASE_WIDTH * (zoom / 100)

  useEffect(() => {
    import("react-pdf").then(({ pdfjs }) => {
      pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`
    })
  }, [])

  // Navigate to clause page when selection changes
  useEffect(() => {
    if (selectedClause?.page_number) {
      goTo(selectedClause.page_number)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClause])

  const goTo = (n: number) => {
    const clamped = Math.max(1, Math.min(n, numPages || 999))
    setPage(clamped)
    setPageInput(String(clamped))
  }

  // Draw highlight overlay — direct lookup by clause_type key, no fuzzy matching
  const drawHighlights = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !pageDims) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (!selectedClause) return

    // Normalize clause_type to match backend key format: uppercase + underscores
    const key = selectedClause.clause_type.toUpperCase().replace(/\s+/g, "_")
    const blocks: LocationEntry[] = (clauseLocations[key] ?? []).filter((b) => b.page === page)
    if (blocks.length === 0) return

    const scale = renderWidth / pageDims.width

    ctx.fillStyle = "rgba(255, 220, 50, 0.4)"
    ctx.strokeStyle = "rgba(200, 160, 0, 0.7)"
    ctx.lineWidth = 1

    for (const loc of blocks) {
      const [x0, y0, x1, y1] = loc.bbox
      ctx.fillRect(x0 * scale, y0 * scale, (x1 - x0) * scale, (y1 - y0) * scale)
      ctx.strokeRect(x0 * scale, y0 * scale, (x1 - x0) * scale, (y1 - y0) * scale)
    }
  }, [selectedClause, clauseLocations, page, pageDims, renderWidth])

  useLayoutEffect(() => {
    drawHighlights()
  }, [drawHighlights])

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
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <button
            onClick={() => goTo(page - 1)}
            disabled={page <= 1}
            style={{
              background: "transparent", border: "none",
              cursor: page <= 1 ? "default" : "pointer",
              color: page <= 1 ? "var(--text-muted)" : "var(--text-secondary)",
              padding: "4px", borderRadius: "4px", display: "flex", alignItems: "center",
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
              onKeyDown={(e) => { if (e.key === "Enter") goTo(parseInt(pageInput) || 1) }}
              style={{
                width: "36px", textAlign: "center",
                background: "var(--surface-base)", border: "1px solid var(--border-subtle)",
                borderRadius: "4px", color: "var(--text-primary)", fontSize: "12px", padding: "2px 4px",
              }}
            />
            <span>/ {numPages || "—"}</span>
          </div>
          <button
            onClick={() => goTo(page + 1)}
            disabled={page >= numPages}
            style={{
              background: "transparent", border: "none",
              cursor: page >= numPages ? "default" : "pointer",
              color: page >= numPages ? "var(--text-muted)" : "var(--text-secondary)",
              padding: "4px", borderRadius: "4px", display: "flex", alignItems: "center",
            }}
          >
            <CaretRight size={14} />
          </button>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <button
            onClick={() => setZoomIndex((i) => Math.max(0, i - 1))}
            disabled={zoomIndex === 0}
            style={{
              background: "transparent", border: "none",
              cursor: zoomIndex === 0 ? "default" : "pointer",
              color: zoomIndex === 0 ? "var(--text-muted)" : "var(--text-secondary)",
              padding: "4px", borderRadius: "4px", display: "flex", alignItems: "center",
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
              background: "transparent", border: "none",
              cursor: zoomIndex === ZOOM_LEVELS.length - 1 ? "default" : "pointer",
              color: zoomIndex === ZOOM_LEVELS.length - 1 ? "var(--text-muted)" : "var(--text-secondary)",
              padding: "4px", borderRadius: "4px", display: "flex", alignItems: "center",
            }}
          >
            <Plus size={14} />
          </button>
        </div>

        <a
          href={pdfUrl}
          download
          style={{
            display: "flex", alignItems: "center", gap: "4px",
            padding: "4px 10px", borderRadius: "6px", fontSize: "12px",
            color: "var(--text-secondary)", border: "1px solid var(--border-subtle)",
            textDecoration: "none", background: "transparent",
          }}
        >
          <DownloadSimple size={14} />
          Download
        </a>
      </div>

      {/* PDF + overlay */}
      <div
        style={{
          flex: 1, overflowY: "auto", overflowX: "auto",
          display: "flex", justifyContent: "center",
          padding: "24px", background: "#1a1a1a",
        }}
      >
        <div style={{ position: "relative", display: "inline-block" }}>
          {/* Clause label banner */}
          {selectedClause && (
            <div
              style={{
                position: "absolute", top: "8px", left: "8px", right: "8px",
                background: "rgba(200,169,110,0.15)", border: "1px solid rgba(200,169,110,0.3)",
                borderRadius: "4px", padding: "6px 10px", fontSize: "12px",
                color: "var(--accent-gold)", zIndex: 10,
              }}
            >
              {selectedClause.clause_type.replace(/_/g, " ")}
              {selectedClause.page_number && ` — Page ${selectedClause.page_number}`}
            </div>
          )}

          <PDFDocumentDynamic
            file={pdfUrl}
            onLoadSuccess={({ numPages: n }) => { setNumPages(n); setPage(1); setPageInput("1") }}
            onLoadError={() => setPdfError(true)}
            loading={
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: `${renderWidth}px`, height: "800px", color: "var(--text-muted)" }}>
                <Spinner />
              </div>
            }
          >
            <PDFPageDynamic
              pageNumber={page}
              width={renderWidth}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              onRenderSuccess={(p) => {
                setPageDims((prev) =>
                  prev?.width === p.originalWidth && prev?.height === p.originalHeight
                    ? prev
                    : { width: p.originalWidth, height: p.originalHeight }
                )
              }}
            />
          </PDFDocumentDynamic>

          {/* Canvas overlay — exact bbox highlights */}
          {pageDims && (
            <canvas
              ref={canvasRef}
              width={renderWidth}
              height={renderWidth * (pageDims.height / pageDims.width)}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                pointerEvents: "none",
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
