"use client"
import { useRouter } from "next/navigation"
import { UploadModal } from "@/components/upload/upload-modal"

export default function UploadPage() {
  const router = useRouter()
  return (
    <UploadModal
      open={true}
      onClose={() => router.push("/documents")}
    />
  )
}
