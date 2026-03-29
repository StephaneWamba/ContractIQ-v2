"use client"
import { useState, useEffect } from "react"
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

export interface AnalysisData {
  summary: string
  key_risks: Array<{ level: string; description: string; reference?: string }>
  recommendations: string[]
}

export function useDocumentDetail(workspaceId: string | null, documentId: string) {
  const [document, setDocument] = useState<Document | null>(null)
  const [clauses, setClauses] = useState<Clause[]>([])
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!workspaceId) return
    const token = getToken()
    if (!token) return

    const api = process.env.NEXT_PUBLIC_API_URL
    const headers = { Authorization: `Bearer ${token}` }

    async function load() {
      try {
        const docRes = await fetch(
          `${api}/workspaces/${workspaceId}/documents/${documentId}`,
          { headers }
        )
        if (docRes.ok) setDocument(await docRes.json())

        const clauseRes = await fetch(
          `${api}/workspaces/${workspaceId}/documents/${documentId}/clauses`,
          { headers }
        )
        if (clauseRes.ok) setClauses(await clauseRes.json())

        const pdfRes = await fetch(
          `${api}/workspaces/${workspaceId}/documents/${documentId}/pdf-url`,
          { headers }
        )
        if (pdfRes.ok) {
          const data = await pdfRes.json()
          setPdfUrl(data.url)
        }

        const analysisRes = await fetch(
          `${api}/workspaces/${workspaceId}/documents/${documentId}/analysis`,
          { headers }
        )
        if (analysisRes.ok) {
          const text = await analysisRes.text()
          setAnalysis({ summary: text, key_risks: [], recommendations: [] })
        }
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [workspaceId, documentId])

  return { document, clauses, analysis, pdfUrl, loading }
}
