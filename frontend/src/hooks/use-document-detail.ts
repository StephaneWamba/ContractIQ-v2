"use client"
import { useState, useEffect, useRef } from "react"
import { getToken } from "@/lib/auth"
import type { Document } from "@/hooks/use-documents"

export interface Clause {
  id: string
  clause_type: string
  text: string
  risk_level: "critical" | "high" | "medium" | "low"
  analysis: string
  page_number?: number
}

export interface LocationEntry {
  page: number
  bbox: [number, number, number, number] // x0, y0, x1, y1 in PDF points
}

// clause_type (uppercase) → array of bbox blocks
export type ClauseLocations = Record<string, LocationEntry[]>

export interface AnalysisData {
  summary: string
  key_risks: Array<{ level: string; description: string; reference?: string }>
  recommendations: string[]
}

function parseAnalysisMd(content: string): { clauses: Clause[]; analysis: AnalysisData } {
  // Summary
  const summaryMatch = content.match(/## Summary\s*([\s\S]*?)(?=\n##)/)
  const summary = summaryMatch ? summaryMatch[1].trim() : ""

  // Clauses — each ### TYPE — LEVEL block
  const clauses: Clause[] = []
  const clauseRe = /### (.+?) —\s*(CRITICAL|HIGH|MEDIUM|LOW)\s*\n([\s\S]*?)(?=\n###|\n##|$)/gi
  let m: RegExpExecArray | null
  let idx = 0
  while ((m = clauseRe.exec(content)) !== null) {
    const clauseType = m[1].trim()
    const riskLevel = m[2].toLowerCase() as Clause["risk_level"]
    const body = m[3]

    const pageMatch = body.match(/\*\*Page:\*\*\s*(\d+)/)
    const textMatch = body.match(/\*\*Text:\*\*\s*"([\s\S]*?)"/)
    const reasoningMatch = body.match(/\*\*Risk Reasoning:\*\*\s*([\s\S]*?)(?=\n\*\*|$)/)

    clauses.push({
      id: `clause-${idx++}`,
      clause_type: clauseType,
      text: textMatch ? textMatch[1].trim() : body.substring(0, 200).trim(),
      risk_level: riskLevel,
      analysis: reasoningMatch ? reasoningMatch[1].trim() : "",
      page_number: pageMatch ? parseInt(pageMatch[1]) : undefined,
    })
  }

  // Negotiation priorities → recommendations
  const negMatch = content.match(/## Negotiation Priorities\s*([\s\S]*?)(?=\n##|$)/)
  const recommendations = negMatch
    ? negMatch[1]
        .split("\n")
        .filter((l) => /^[-\d.]/.test(l.trim()))
        .map((l) => l.replace(/^[-\d.]\s*/, "").trim())
        .filter(Boolean)
    : []

  const key_risks = clauses
    .filter((c) => c.risk_level === "critical" || c.risk_level === "high")
    .map((c) => ({ level: c.risk_level, description: c.analysis || c.text.substring(0, 100) }))

  return { clauses, analysis: { summary, key_risks, recommendations } }
}

export function useDocumentDetail(workspaceId: string | null, documentId: string) {
  const [document, setDocument] = useState<Document | null>(null)
  const [clauses, setClauses] = useState<Clause[]>([])
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [clauseLocations, setClauseLocations] = useState<ClauseLocations>({})
  const [loading, setLoading] = useState(true)
  const analysisLoadedRef = useRef(false)
  const pdfLoadedRef = useRef(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!workspaceId) return
    const token = getToken()
    if (!token) return

    const api = process.env.NEXT_PUBLIC_API_URL
    const headers = { Authorization: `Bearer ${token}` }

    async function loadAnalysis() {
      if (analysisLoadedRef.current) return
      const [analysisRes, clauseLocsRes] = await Promise.all([
        fetch(`${api}/documents/${documentId}/analysis`, { headers }),
        fetch(`${api}/documents/${documentId}/clause-locations`, { headers }),
      ])
      if (!analysisRes.ok) return
      const data = await analysisRes.json()
      const parsed = parseAnalysisMd(data.content as string)
      setClauses(parsed.clauses)
      setAnalysis(parsed.analysis)
      if (clauseLocsRes.ok) {
        const locs: ClauseLocations = await clauseLocsRes.json()
        setClauseLocations(locs)
      }
      analysisLoadedRef.current = true
    }

    async function load() {
      try {
        const listRes = await fetch(`${api}/documents?workspace_id=${workspaceId}`, { headers })
        if (!listRes.ok) return
        const docs = await listRes.json()
        const doc: Document | undefined = Array.isArray(docs)
          ? docs.find((d: { id: string }) => d.id === documentId)
          : undefined
        if (!doc) return
        setDocument(doc)

        // PDF — fetch as blob with auth to avoid GCS CORS (react-pdf can't pass headers)
        if (!pdfLoadedRef.current) {
          pdfLoadedRef.current = true
          fetch(`${api}/documents/${documentId}/pdf`, { headers })
            .then((r) => r.blob())
            .then((blob) => setPdfUrl(URL.createObjectURL(blob)))
            .catch(() => {
              fetch(`${api}/documents/${documentId}/pdf-url`, { headers })
                .then((r) => r.json())
                .then((d) => setPdfUrl(d.url))
                .catch(() => {})
            })
        }

        if (doc.status === "ready") {
          await loadAnalysis()
        }
      } finally {
        setLoading(false)
      }
    }

    load()

    // Poll every 8s while processing to catch status → ready transition
    pollRef.current = setInterval(async () => {
      const listRes = await fetch(`${api}/documents?workspace_id=${workspaceId}`, { headers })
      if (!listRes.ok) return
      const docs = await listRes.json()
      const doc: Document | undefined = Array.isArray(docs)
        ? docs.find((d: { id: string }) => d.id === documentId)
        : undefined
      if (!doc) return
      setDocument(doc)

      if (doc.status === "ready") {
        if (pollRef.current) clearInterval(pollRef.current)
        await loadAnalysis()
      }
    }, 8000)

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, documentId])

  return { document, clauses, analysis, pdfUrl, clauseLocations, loading }
}
