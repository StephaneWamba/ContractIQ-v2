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

    const formData = new FormData()
    formData.append("file", opts.file)
    formData.append("contract_type", opts.contractType)
    formData.append("party_perspective", opts.partyPerspective)

    try {
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open(
          "POST",
          `${process.env.NEXT_PUBLIC_API_URL}/workspaces/${opts.workspaceId}/documents/upload`
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
