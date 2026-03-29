import { PageHeader } from "@/components/layout/page-header"

export default function DashboardPage() {
  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Welcome to ContractIQ" />
      <p style={{ color: "var(--text-muted)" }}>Loading your workspace...</p>
    </div>
  )
}
