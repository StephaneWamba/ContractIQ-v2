import { cn } from "@/lib/utils"

const AVATAR_COLORS = [
  "#3D4A5C",
  "#4A3D5C",
  "#3D5C4A",
  "#5C4A3D",
  "#3D5C5C",
  "#5C3D4A",
]

const sizeMap = {
  sm: 24,
  md: 28,
  lg: 40,
  xl: 64,
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function getColorIndex(name: string): number {
  const sum = name.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return sum % AVATAR_COLORS.length
}

interface AvatarProps {
  name: string
  src?: string
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

export function Avatar({ name, src, size = "md", className }: AvatarProps) {
  const px = sizeMap[size]
  const bg = AVATAR_COLORS[getColorIndex(name)]
  const fontSize = Math.max(10, Math.round(px * 0.39))

  return (
    <span
      className={cn("inline-flex items-center justify-center rounded-full overflow-hidden flex-shrink-0", className)}
      style={{ width: px, height: px, background: src ? undefined : bg }}
      title={name}
    >
      {src ? (
        <img src={src} alt={name} width={px} height={px} className="object-cover w-full h-full" />
      ) : (
        <span style={{ color: "#F2F2F2", fontSize, fontWeight: 600, lineHeight: 1 }}>
          {getInitials(name)}
        </span>
      )}
    </span>
  )
}
