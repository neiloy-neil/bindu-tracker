import { createClient } from '@/lib/supabase/server'
import { format, subWeeks, startOfWeek } from 'date-fns'
import { Scissors, Package2, CheckSquare2, Truck, Activity, AlertTriangle, TrendingDown } from 'lucide-react'
import Link from 'next/link'
import KPICard from '@/components/dashboard/KPICard'
import StageCountGrid from '@/components/dashboard/StageCountGrid'
import TodaySummary from '@/components/dashboard/TodaySummary'
import MonthlyTotals from '@/components/dashboard/MonthlyTotals'
import WeeklyTrendChart from '@/components/dashboard/WeeklyTrendChart'
import AtRiskPanel from '@/components/dashboard/AtRiskPanel'
import { BentoGrid } from '@/components/shared/BentoGrid'
import { BentoCard } from '@/components/shared/BentoCard'
import type { MonthlySummaryAgg } from '@/components/dashboard/MonthlyTotals'
import type { WeekPoint } from '@/components/dashboard/WeeklyTrendChart'
import type { AtRiskProduct } from '@/components/dashboard/AtRiskPanel'
import type { ProductionEntry } from '@/types/app'

export const dynamic = 'force-dynamic'

const STALE_DAYS = 7

export default async function DashboardPage() {
  const supabase = await createClient()
  const today = format(new Date(), 'yyyy-MM-dd')
  const monthStart = format(new Date(), 'yyyy-MM-01')
  const nextMonth = format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1), 'yyyy-MM-dd')
  const trendFrom = format(subWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), 7), 'yyyy-MM-dd')
  const riskDeadline = format(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')

  const [productsRes, monthlyRes, todayRes, trendRes, atRiskRes] = await Promise.all([
    supabase.from('products').select('current_stage, updated_at'),
    supabase.from('monthly_summary').select('*').gte('month', monthStart).lt('month', nextMonth),
    supabase.from('production_entries').select('*').eq('entry_date', today).order('created_at'),
    supabase.from('production_entries')
      .select('entry_date, cut_color_1, cut_color_2, cut_color_3, cut_color_4, cut_color_5, finished_goods_qty, dispatch_retail_qty, dispatch_wholesale_qty')
      .gte('entry_date', trendFrom)
      .order('entry_date'),
    supabase.from('products')
      .select('id, product_code, product_name, current_stage, target_dispatch_date')
      .lte('target_dispatch_date', riskDeadline)
      .not('current_stage', 'in', '("Dispatched","Completed")')
      .not('target_dispatch_date', 'is', null)
      .order('target_dispatch_date'),
  ])

  const allProducts = productsRes.data ?? []

  // Stage counts
  const stageCounts: Record<string, number> = {}
  for (const p of allProducts) {
    stageCounts[p.current_stage] = (stageCounts[p.current_stage] ?? 0) + 1
  }
  const totalProducts = allProducts.length
  const activeDesigns = allProducts.filter(p => p.current_stage !== 'Completed').length
  const staleProducts = allProducts.filter(p => {
    if (p.current_stage === 'Completed') return false
    const diff = (Date.now() - new Date(p.updated_at).getTime()) / (1000 * 60 * 60 * 24)
    return diff >= STALE_DAYS
  }).length

  // Monthly aggregates
  const monthRows = monthlyRes.data ?? []
  const n = (key: string) => monthRows.reduce((s, r) => s + (Number(r[key]) || 0), 0)
  const monthly: MonthlySummaryAgg | null = monthRows.length === 0 ? null : {
    total_cutting:     n('total_cutting'),
    total_pe_sending:  n('total_pe_sending'),
    total_pe_received: n('total_pe_received'),
    total_swing_out:   n('total_swing_out'),
    total_swing_in:    n('total_swing_in'),
    total_qc_output:   n('total_qc_output'),
    total_reject:      n('total_reject'),
    total_alter:       n('total_alter'),
    total_finished:    n('total_finished'),
    total_retail:      n('total_retail'),
    total_wholesale:   n('total_wholesale'),
  }

  const totalDispatched = (monthly?.total_retail ?? 0) + (monthly?.total_wholesale ?? 0)
  const totalCut = monthly?.total_cutting ?? 0
  const cutToShip = totalCut > 0 ? Math.round((totalDispatched / totalCut) * 100) : 0

  const totalQcIn = n('total_qc_received') || n('total_qc_output') + n('total_reject')
  const rejectRate = totalQcIn > 0
    ? ((n('total_reject') / totalQcIn) * 100).toFixed(1) + '%'
    : '—'

  const todayEntries = (todayRes.data ?? []) as ProductionEntry[]
  const atRiskProducts = (atRiskRes.data ?? []) as AtRiskProduct[]

  // Build weekly trend — bucket each entry_date into its Mon-start ISO week
  const weekMap = new Map<string, WeekPoint>()
  for (const row of trendRes.data ?? []) {
    const d = new Date(row.entry_date)
    const wStart = startOfWeek(d, { weekStartsOn: 1 })
    const key = format(wStart, 'yyyy-MM-dd')
    const label = format(wStart, 'MMM d')
    const existing = weekMap.get(key) ?? { week: label, Cut: 0, Finished: 0, Dispatched: 0 }
    existing.Cut        += (Number(row.cut_color_1)||0) + (Number(row.cut_color_2)||0) + (Number(row.cut_color_3)||0) + (Number(row.cut_color_4)||0) + (Number(row.cut_color_5)||0)
    existing.Finished   += Number(row.finished_goods_qty)      || 0
    existing.Dispatched += (Number(row.dispatch_retail_qty)||0) + (Number(row.dispatch_wholesale_qty)||0)
    weekMap.set(key, existing)
  }
  const trendData: WeekPoint[] = Array.from(weekMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v)

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Production Dashboard</h2>
          <p className="text-sm text-slate-500 mt-0.5">{format(new Date(), 'EEEE, dd MMMM yyyy')}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/daily" className="px-3 py-1.5 text-xs font-medium bg-white border rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
            Daily Entry →
          </Link>
          <Link href="/dashboard/pipeline" className="px-3 py-1.5 text-xs font-medium bg-white border rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
            Pipeline →
          </Link>
          <Link href="/dashboard/products" className="px-3 py-1.5 text-xs font-medium bg-[#1A3557] text-white rounded-lg hover:bg-[#142a45] transition-colors">
            All Products →
          </Link>
        </div>
      </div>

      {/* At-risk alert panel */}
      {atRiskProducts.length > 0 && (
        <div className="mb-8">
          <AtRiskPanel products={atRiskProducts} />
        </div>
      )}

      <BentoGrid className="mb-8">
        {/* KPI Row 1 — production volumes */}
        <div className="col-span-full">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">This Month — {format(new Date(), 'MMMM yyyy')}</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard title="Cut" value={totalCut} icon={Scissors} color="blue" sub="pieces cut" />
          <KPICard title="Finished" value={monthly?.total_finished ?? 0} icon={CheckSquare2} color="purple" sub="pieces finished" />
          <KPICard title="Dispatched" value={totalDispatched} icon={Truck} color="sky" sub="retail + wholesale" />
          <KPICard title="Cut-to-Ship" value={cutToShip + '%'} icon={TrendingDown} color="teal" sub="dispatched / cut" />
        </div>
        </div>

        {/* KPI Row 2 — pipeline health */}
        <div className="col-span-full mt-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Pipeline Health</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard title="Total Products" value={totalProducts} icon={Package2} color="blue" sub="in system" />
          <KPICard title="Active Designs" value={activeDesigns} icon={Activity} color="teal" sub="not completed" />
          <KPICard title="Reject Rate" value={rejectRate} icon={TrendingDown} color="purple" sub="this month" />
          <Link href="/dashboard/pipeline">
            <KPICard
              title="Stale Designs"
              value={staleProducts}
              icon={AlertTriangle}
              color="sky"
              sub={`no update in ${STALE_DAYS}+ days`}
            />
          </Link>
        </div>
        </div>

        {/* Stage count grid */}
        <BentoCard className="col-span-full xl:col-span-2">
          <StageCountGrid counts={stageCounts} />
        </BentoCard>

        {/* Weekly trend chart */}
        <BentoCard className="col-span-full xl:col-span-2 flex flex-col justify-center">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">Weekly Trend — last 8 weeks</p>
          <WeeklyTrendChart data={trendData} />
        </BentoCard>
      </BentoGrid>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Today's summary */}
        <BentoCard>
          <TodaySummary entries={todayEntries} />
        </BentoCard>

        {/* Monthly totals */}
        <BentoCard>
          <MonthlyTotals data={monthly} />
        </BentoCard>
      </div>
    </div>
  )
}
