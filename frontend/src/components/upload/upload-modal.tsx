"use client"
import { useState, useRef, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FilePdf, X, UploadSimple } from "@phosphor-icons/react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PillGroup } from "@/components/ui/pill-group"
import { useUpload } from "@/hooks/use-upload"
import { useWorkspace } from "@/hooks/use-workspace"

const CONTRACT_TYPES = [
  { value: "NDA", label: "NDA" },
  { value: "SAAS_AGREEMENT", label: "SaaS Agreement" },
  { value: "EMPLOYMENT", label: "Employment" },
  { value: "MSA", label: "MSA" },
  { value: "SOW", label: "SOW" },
  { value: "OTHER", label: "Other" },
]

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface UploadModalProps {
  open: boolean
  onClose: () => void
}

type Step = "idle" | "uploading" | "done"

export function UploadModal({ open, onClose }: UploadModalProps) {
  const [step, setStep] = useState<Step>("idle")
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [contractType, setContractType] = useState<string | null>(null)
  const [partyPerspective, setPartyPerspective] = useState<"provider" | "client" | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { upload, uploading, progress, error: uploadError } = useUpload()
  const { workspace } = useWorkspace()

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setStep("idle")
      setFile(null)
      setFileError(null)
      setContractType(null)
      setPartyPerspective(null)
      setIsDragOver(false)
    }
  }, [open])

  const validateFile = (f: File): string | null => {
    if (!f.name.toLowerCase().endsWith(".pdf")) return "Only PDF files are accepted"
    if (f.size > MAX_FILE_SIZE) return "File too large (max 50MB)"
    return null
  }

  const handleFile = (f: File) => {
    const err = validateFile(f)
    if (err) {
      setFileError(err)
      setFile(null)
      return
    }
    setFileError(null)
    setFile(f)
  }

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) handleFile(dropped)
  }, [])

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => setIsDragOver(false)

  const handleBrowse = () => fileInputRef.current?.click()

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
    // Reset input so same file can be re-selected
    e.target.value = ""
  }

  const canSubmit = file && contractType && partyPerspective && !uploading

  const handleSubmit = async () => {
    if (!canSubmit || !workspace) return
    setStep("uploading")
    await upload({
      workspaceId: workspace.id,
      file,
      contractType,
      partyPerspective,
    })
    setStep("done")
    setTimeout(() => {
      onClose()
      toast(
        `${file.name} is being analyzed — we'll update this page when it's ready.`,
        { duration: 6000 }
      )
    }, 500)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent
        style={{
          width: "560px",
          maxWidth: "560px",
          borderRadius: "14px",
          background: "var(--surface-elevated)",
          border: "1px solid var(--border-subtle)",
          padding: 0,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <DialogHeader style={{ padding: "24px 24px 0" }}>
          <DialogTitle style={{ fontSize: "17px", fontWeight: 600, color: "var(--text-primary)" }}>
            Analyze a contract
          </DialogTitle>
        </DialogHeader>

        <div style={{ padding: "20px 24px 24px", display: "flex", flexDirection: "column", gap: "20px" }}>
          {step === "idle" && (
            <>
              {/* Drop zone / file selected */}
              {!file ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={handleBrowse}
                  style={{
                    border: `2px dashed ${isDragOver ? "var(--accent-gold)" : "var(--border-default)"}`,
                    borderRadius: "10px",
                    padding: "32px 24px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "10px",
                    cursor: "pointer",
                    background: isDragOver ? "var(--accent-gold-dim)" : "transparent",
                    transition: "all 150ms",
                  }}
                >
                  <FilePdf size={36} color="var(--accent-gold)" />
                  <p style={{ fontSize: "14px", color: "var(--text-secondary)", textAlign: "center" }}>
                    Drop your PDF here{" "}
                    <span style={{ color: "var(--accent-gold)" }}>or browse files</span>
                  </p>
                  <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>PDF only · max 50MB</p>
                  {fileError && (
                    <p style={{ fontSize: "12px", color: "#f87171" }}>{fileError}</p>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    style={{ display: "none" }}
                    onChange={handleFileInput}
                  />
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "14px 16px",
                    border: "1px solid var(--border-default)",
                    borderRadius: "10px",
                    background: "var(--surface-overlay)",
                  }}
                >
                  <FilePdf size={28} color="var(--accent-gold)" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "14px", color: "var(--text-primary)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {file.name}
                    </p>
                    <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>{formatBytes(file.size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setFile(null); setFileError(null) }}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--text-muted)",
                      padding: "4px",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <X size={16} />
                  </button>
                </motion.div>
              )}

              {/* Metadata — stagger in after file selected */}
              <AnimatePresence>
                {file && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.2, delay: 0.05 }}
                    style={{ display: "flex", flexDirection: "column", gap: "16px" }}
                  >
                    {/* Contract type */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <label style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)" }}>
                        Contract type
                      </label>
                      <PillGroup
                        options={CONTRACT_TYPES}
                        value={contractType}
                        onChange={setContractType}
                      />
                    </div>

                    {/* Party perspective */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <label style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)" }}>
                        Your role
                      </label>
                      <PillGroup
                        options={[
                          { value: "provider", label: "We are providing services" },
                          { value: "client", label: "We are receiving services" },
                        ]}
                        value={partyPerspective}
                        onChange={(v) => setPartyPerspective(v as "provider" | "client")}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Footer */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", paddingTop: "4px" }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-default)",
                    background: "transparent",
                    color: "var(--text-secondary)",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  style={{
                    padding: "8px 18px",
                    borderRadius: "8px",
                    border: "none",
                    background: canSubmit ? "var(--accent-gold)" : "var(--surface-overlay)",
                    color: canSubmit ? "#0c0c0e" : "var(--text-muted)",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: canSubmit ? "pointer" : "not-allowed",
                    transition: "all 150ms",
                  }}
                >
                  Analyze contract →
                </button>
              </div>
            </>
          )}

          {step === "uploading" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", padding: "16px 0" }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              >
                <UploadSimple size={20} color="var(--accent-gold)" />
              </motion.div>
              <p style={{ fontSize: "15px", fontWeight: 500, color: "var(--text-primary)" }}>Uploading...</p>
              {file && (
                <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                  {file.name} · {formatBytes(file.size)}
                </p>
              )}
              <div style={{ width: "100%", height: "3px", background: "var(--surface-overlay)", borderRadius: "2px" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${progress}%`,
                    background: "var(--accent-gold)",
                    borderRadius: "2px",
                    transition: "width 200ms",
                  }}
                />
              </div>
              <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>{progress}%</p>
              {uploadError && (
                <p style={{ fontSize: "13px", color: "#f87171" }}>{uploadError}</p>
              )}
            </div>
          )}

          {step === "done" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", padding: "24px 0" }}>
              <p style={{ fontSize: "15px", color: "var(--text-primary)" }}>Upload complete!</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
