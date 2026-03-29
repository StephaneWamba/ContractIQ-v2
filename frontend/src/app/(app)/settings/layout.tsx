import { SettingsNav } from "@/components/settings/settings-nav"

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <h1
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: "22px",
          fontWeight: 400,
          marginBottom: "32px",
        }}
      >
        Settings
      </h1>
      <div style={{ display: "flex", gap: "48px" }}>
        <SettingsNav />
        <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
      </div>
    </div>
  )
}
