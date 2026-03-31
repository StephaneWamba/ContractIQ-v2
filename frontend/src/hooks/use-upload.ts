"use client"
import { useState } from "react"
import { getToken } from "@/lib/auth"

interface UploadOptions {
  workspaceId: string
  file: File
  contractType: string
  partyPerspective: "provider" | "client"
  onProgress?: (pct: number) => void
}

export function useUpload() {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  async function upload(opts: UploadOptions): Promise<void> {
    setUploading(true)
    setProgress(0)
    setError(null)

    const token = getToken()
    if (!token) {
      setError("Not authenticated")
      setUploading(false)
      return
    }

    // Map UI perspective values to API enum values
    const perspectiveMap: Record<string, string> = {
      provider: "vendor",
      client: "customer",
      vendor: "vendor",
      customer: "customer",
    }

    const formData = new FormData()
    formData.append("file", opts.file)
    formData.append("workspace_id", opts.workspaceId)
    formData.append("party_perspective", perspectiveMap[opts.partyPerspective] ?? "unknown")

    try {
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open(
          "POST",
          `${process.env.NEXT_PUBLIC_API_URL}/documents`
        )
        xhr.setRequestHeader("Authorization", `Bearer ${token}`)
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100)
            setProgress(pct)
            opts.onProgress?.(pct)
          }
        }
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve()
          } else {
            try {
              const body = JSON.parse(xhr.responseText)
              reject(new Error(body?.detail || "Upload failed"))
            } catch {
              reject(new Error("Upload failed"))
            }
          }
        }
        xhr.onerror = () => reject(new Error("Network error"))
        xhr.send(formData)
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  return { upload, uploading, progress, error }
}
