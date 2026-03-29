import { cn } from "@/lib/utils"

interface SpinnerProps {
  size?: "sm" | "md"
  className?: string
}

const sizeMap = {
  sm: 14,
  md: 20,
}

export function Spinner({ size = "md", className }: SpinnerProps) {
  const px = sizeMap[size]
  return (
    <span
      className={cn("inline-block rounded-full border-2 border-transparent animate-spin", className)}
      style={{
        width: px,
        height: px,
        borderTopColor: "var(--accent-gold)",
        borderRightColor: "var(--accent-gold)",
      }}
      aria-label="Loading"
    />
  )
}
