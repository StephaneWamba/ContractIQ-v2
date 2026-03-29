"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"

const NAV_ITEMS = [
  { href: "/app/settings/profile", label: "Profile" },
  { href: "/app/settings/workspace", label: "Workspace" },
  { href: "/app/settings/billing", label: "Billing" },
  { href: "/app/settings/danger", label: "Danger zone" },
]

export function SettingsNav() {
  const pathname = usePathname()

  return (
    <nav style={{ width: "160px", flexShrink: 0 }}>
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href
        const isDanger = item.href === "/app/settings/danger"
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: "block",
              padding: "6px 0",
              fontSize: "14px",
              textDecoration: "none",
              color: isDanger
                ? "var(--semantic-error)"
                : isActive
                ? "var(--text-primary)"
                : "var(--text-secondary)",
              fontWeight: isActive ? 500 : 400,
              transition: "color 120ms",
            }}
            onMouseEnter={(e) => {
              if (!isDanger) {
                (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-primary)"
              }
            }}
            onMouseLeave={(e) => {
              if (!isDanger) {
                (e.currentTarget as HTMLAnchorElement).style.color = isActive
                  ? "var(--text-primary)"
                  : "var(--text-secondary)"
              }
            }}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
