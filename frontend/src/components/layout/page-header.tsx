interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        marginBottom: "32px",
      }}
    >
      <div>
        <h1
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "22px",
            color: "var(--text-primary)",
            fontWeight: 400,
            marginBottom: subtitle ? "4px" : 0,
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {actions}
        </div>
      )}
    </div>
  )
}
