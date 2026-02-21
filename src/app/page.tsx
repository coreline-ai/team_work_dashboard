import { KpiWidgets } from "@/components/dashboard/kpi-widgets"
import { WeeklyComboChart } from "@/components/dashboard/weekly-combo-chart"
import { StatusPieChart } from "@/components/dashboard/status-pie-chart"
import { RecentActivityTable } from "@/components/dashboard/recent-activity-table"

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">프로젝트 전체 현황 및 통계</p>
      </div>

      {/* T-4: KPI Widgets (Gauge + Summary) */}
      <KpiWidgets />

      {/* T-5: Charts (Combo + Pie) */}
      <div className="grid gap-4 md:grid-cols-7">
        <WeeklyComboChart />
        <StatusPieChart />
      </div>

      {/* Recent Activity Table */}
      <RecentActivityTable />
    </div>
  )
}
