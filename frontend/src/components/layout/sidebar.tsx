"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  GridFour,
  Files,
  MagnifyingGlass,
  FileText,
  Gear,
  List,
  Plus,
} from "@phosphor-icons/react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Avatar } from "@/components/ui/avatar"
import { clearToken } from "@/lib/auth"
import { useWorkspace } from "@/hooks/use-workspace"

const STORAGE_KEY = "ciq_sidebar_collapsed"

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
}

const mainNav: NavItem[] = [
  { label: "Dashboard", href: "/app/dashboard", icon: GridFour },
  { label: "Documents", href: "/app/documents", icon: Files },
  { label: "Search", href: "/app/search", icon: MagnifyingGlass },
]

const PLAYBOOK_TYPES = [
  { slug: "nda", label: "NDA" },
  { slug: "saas-agreement", label: "SaaS Agreement" },
  { slug: "employment", label: "Employment" },
  { slug: "msa", label: "MSA" },
  { slug: "sow", label: "SOW" },
]

function NavItemLink({
  item,
  collapsed,
  active,
}: {
  item: NavItem
  collapsed: boolean
  active: boolean
}) {
  const Icon = item.icon

  const inner = (
    <Link
      href={item.href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        height: "36px",
        padding: "0 12px",
        borderRadius: "6px",
        textDecoration: "none",
        transition: "background 120ms",
        background: active ? "rgba(200, 169, 110, 0.1)" : "transparent",
        boxShadow: active ? "inset 2px 0 0 var(--accent-gold)" : "none",
        cursor: "pointer",
        overflow: "hidden",
        flexShrink: 0,
      }}
      className="sidebar-nav-item"
    >
      <Icon
        size={16}
        weight="regular"
        style={{ color: active ? "var(--text-primary)" : "var(--text-muted)", flexShrink: 0 }}
      />
      <span
        style={{
          fontSize: "14px",
          color: active ? "var(--text-primary)" : "var(--text-secondary)",
          whiteSpace: "nowrap",
          opacity: collapsed ? 0 : 1,
          width: collapsed ? 0 : "auto",
          overflow: "hidden",
          transition: "opacity 200ms cubic-bezier(0.4, 0, 0.2, 1), width 200ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {item.label}
      </span>
    </Link>
  )

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{inner}</TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    )
  }

  return inner
}

function PlaybookLink({
  slug,
  label,
  collapsed,
  active,
}: {
  slug: string
  label: string
  collapsed: boolean
  active: boolean
}) {
  const href = `/app/playbooks/${slug}`

  const inner = (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        height: "36px",
        padding: "0 12px",
        borderRadius: "6px",
        textDecoration: "none",
        transition: "background 120ms",
        background: active ? "rgba(200, 169, 110, 0.1)" : "transparent",
        boxShadow: active ? "inset 2px 0 0 var(--accent-gold)" : "none",
        overflow: "hidden",
        flexShrink: 0,
      }}
      className="sidebar-nav-item"
    >
      <FileText
        size={16}
        weight="regular"
        style={{ color: active ? "var(--text-primary)" : "var(--text-muted)", flexShrink: 0 }}
      />
      <span
        style={{
          fontSize: "14px",
          color: active ? "var(--text-primary)" : "var(--text-secondary)",
          whiteSpace: "nowrap",
          opacity: collapsed ? 0 : 1,
          width: collapsed ? 0 : "auto",
          overflow: "hidden",
          transition: "opacity 200ms cubic-bezier(0.4, 0, 0.2, 1), width 200ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {label}
      </span>
    </Link>
  )

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{inner}</TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    )
  }

  return inner
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [playbookSectionHovered, setPlaybookSectionHovered] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { me } = useWorkspace()

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored !== null) {
      setCollapsed(stored === "true")
    }
  }, [])

  function toggleCollapsed() {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem(STORAGE_KEY, String(next))
  }

  function handleSignOut() {
    clearToken()
    router.push("/login")
  }

  return (
    <TooltipProvider delayDuration={300}>
      <aside
        style={{
          width: collapsed ? "52px" : "260px",
          transition: "width 200ms cubic-bezier(0.4, 0, 0.2, 1)",
          height: "100vh",
          position: "sticky",
          top: 0,
          display: "flex",
          flexDirection: "column",
          background: "var(--surface-elevated)",
          borderRight: "1px solid var(--border-subtle)",
          flexShrink: 0,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "space-between",
            padding: collapsed ? "16px 0" : "16px 12px",
            height: "56px",
            flexShrink: 0,
          }}
        >
          {!collapsed && (
            <Link href="/app/dashboard" style={{ textDecoration: "none" }}>
              <span
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "16px",
                  color: "var(--accent-gold)",
                }}
              >
                ContractIQ
              </span>
            </Link>
          )}
          {collapsed && (
            <span
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "13px",
                color: "var(--accent-gold)",
                fontWeight: 600,
              }}
            >
              CQ
            </span>
          )}
          <button
            onClick={toggleCollapsed}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "4px",
              borderRadius: "4px",
              color: "var(--text-muted)",
              flexShrink: 0,
            }}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <List size={16} weight="regular" />
          </button>
        </div>

        {/* Main nav */}
        <nav style={{ padding: "4px 8px", flexShrink: 0 }}>
          {mainNav.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <NavItemLink
                key={item.href}
                item={item}
                collapsed={collapsed}
                active={active}
              />
            )
          })}
        </nav>

        {/* Divider */}
        <div
          style={{
            height: "1px",
            background: "var(--border-subtle)",
            margin: "8px 0",
            flexShrink: 0,
          }}
        />

        {/* Playbooks section */}
        <div
          style={{ padding: "0 8px", flexShrink: 0 }}
          onMouseEnter={() => setPlaybookSectionHovered(true)}
          onMouseLeave={() => setPlaybookSectionHovered(false)}
        >
          {!collapsed && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 4px 6px",
              }}
            >
              <span
                style={{
                  fontSize: "10px",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                }}
              >
                Playbooks
              </span>
              {playbookSectionHovered && (
                <Link
                  href="/app/documents/upload"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--text-muted)",
                    textDecoration: "none",
                    padding: "2px",
                    borderRadius: "4px",
                  }}
                  title="Upload document"
                >
                  <Plus size={14} weight="regular" />
                </Link>
              )}
            </div>
          )}
          {PLAYBOOK_TYPES.map(({ slug, label }) => {
            const href = `/app/playbooks/${slug}`
            const active = pathname === href || pathname.startsWith(href + "/")
            return (
              <PlaybookLink
                key={slug}
                slug={slug}
                label={label}
                collapsed={collapsed}
                active={active}
              />
            )
          })}
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Bottom nav */}
        <div style={{ padding: "4px 8px", flexShrink: 0 }}>
          {(() => {
            const settingsItem: NavItem = {
              label: "Settings",
              href: "/app/settings",
              icon: Gear,
            }
            const active =
              pathname === settingsItem.href ||
              pathname.startsWith(settingsItem.href + "/")
            return (
              <NavItemLink
                item={settingsItem}
                collapsed={collapsed}
                active={active}
              />
            )
          })()}
        </div>

        {/* User block */}
        <div style={{ padding: "8px", flexShrink: 0 }}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
                className="sidebar-nav-item"
              >
                <Avatar name={me?.name || "User"} size="sm" />
                {!collapsed && (
                  <span
                    style={{
                      fontSize: "13px",
                      color: "var(--text-secondary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      maxWidth: "120px",
                    }}
                  >
                    {me?.name || "Account"}
                  </span>
                )}
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              style={{
                background: "var(--surface-elevated)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "8px",
              }}
            >
              <DropdownMenuItem onClick={() => router.push("/app/settings")}>
                Account settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleSignOut}
                style={{ color: "var(--semantic-error)" }}
              >
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      <style>{`
        .sidebar-nav-item:hover {
          background: var(--surface-overlay) !important;
        }
        .sidebar-nav-item:hover span {
          color: var(--text-primary) !important;
        }
      `}</style>
    </TooltipProvider>
  )
}
