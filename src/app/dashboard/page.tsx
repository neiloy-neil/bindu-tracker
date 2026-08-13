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
  const totalQcIn = n('total_qc_received') || (n('total_qc_output') + n('total_reject'))
  const rejectRate = totalQcIn > 0
    ? ((n('total_reject') / totalQcIn) * 100).toFixed(1) + '%'
    : '—'

  const todayEntries = (todayRes.data ?? []) as ProductionEntry[]
  const atRiskProducts = (atRiskRes.data ?? []) as AtRiskProduct[]

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
    <div className="max-w-7xl space-y-6 pb-12">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-black text-foreground tracking-tight">Production Command Center</h2>
          <p className="text-sm font-medium text-muted-foreground mt-1">{format(new Date(), 'EEEE, dd MMMM yyyy')}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/daily" className="px-4 py-2 text-xs font-bold bg-white border border-border/80 rounded-lg text-slate-700 hover:bg-slate-50 hover:border-border transition-all shadow-sm hover:shadow">
            Daily Entry →
          </Link>
          <Link href="/dashboard/pipeline" className="px-4 py-2 text-xs font-bold bg-white border border-border/80 rounded-lg text-slate-700 hover:bg-slate-50 hover:border-border transition-all shadow-sm hover:shadow">
            Pipeline →
          </Link>
          <Link href="/dashboard/products/new" className="px-4 py-2 text-xs font-bold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all shadow-sm hover:shadow hover:-translate-y-0.5">
            + New Product
          </Link>
        </div>
      </div>

      {/* Quick-start guide */}
      {allProducts.length === 0 && (
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-5 space-y-4">
          <p className="font-bold text-blue-900 text-sm">Get started with Bindu Tracker</p>
          <ol className="space-y-2">
            {[
              { step: 1, title: 'Add a Product', desc: 'Go to Products → New Product. Enter the design code, name, and target dispatch date.', href: '/dashboard/products/new', cta: 'Add your first product →' },
              { step: 2, title: 'Fill in Cutting Details', desc: 'Open the product and fill in Step 1 — Cutting with color names and quantities.', href: null, cta: null },
              { step: 3, title: 'Record Daily Work', desc: 'Each day, go to Daily Logs and fill in today\'s numbers for each design code.', href: '/dashboard/daily', cta: 'Open Daily Logs →' },
              { step: 4, title: 'Track Progress', desc: 'Use Pipeline to see all active designs and their current stage at a glance.', href: '/dashboard/pipeline', cta: 'Open Pipeline →' },
            ].map(({ step, title, desc, href, cta }) => (
              <li key={step} className="flex items-start gap-3 text-sm text-blue-800">
                <span className="mt-0.5 shrink-0 font-bold bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] shadow-sm">{step}</span>
                <span>
                  <strong>{title}:</strong> {desc}
                  {href && cta && (
                    <Link href={href} className="ml-2 underline font-semibold text-blue-900 hover:text-blue-950">{cta}</Link>
                  )}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* At-risk alert */}
      {atRiskProducts.length > 0 && (
        <div className="animate-fade-up" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
          <AtRiskPanel products={atRiskProducts} />
        </div>
      )}

      {/* KPI section — This Month */}
      <div className="animate-fade-up" style={{ animationDelay: '150ms', animationFillMode: 'both' }}>
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3 px-1">
          {format(new Date(), 'MMMM yyyy')} — Production Volumes
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard title="Cut This Month" value={totalCut} icon={<Scissors />} color="blue" sub="pieces cut" />
          <KPICard title="Finished" value={monthly?.total_finished ?? 0} icon={<CheckSquare2 />} color="purple" sub="pieces finished" />
          <KPICard title="Dispatched" value={totalDispatched} icon={<Truck />} color="sky" sub="retail + wholesale" />
          <KPICard title="Cut-to-Ship" value={cutToShip + '%'} icon={<TrendingDown />} color="teal" sub="dispatched / cut" />
        </div>
      </div>

      {/* Pipeline health KPIs */}
      <div className="animate-fade-up" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3 px-1">Pipeline Health</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard title="Total Products" value={totalProducts} icon={<Package2 />} color="blue" sub="in system" />
          <KPICard title="Active Designs" value={activeDesigns} icon={<Activity />} color="teal" sub="not completed" />
          <KPICard title="Reject Rate" value={rejectRate} icon={<TrendingDown />} color={rejectRate !== '—' && parseFloat(rejectRate) > 5 ? 'red' : 'purple'} sub="this month" />
          <Link href="/dashboard/pipeline" className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-light rounded-xl">
            <KPICard
              title="Stale Designs"
              value={staleProducts}
              icon={<AlertTriangle />}
              color={staleProducts > 0 ? 'amber' : 'sky'}
              sub={`no update in ${STALE_DAYS}+ days`}
            />
          </Link>
        </div>
      </div>

      {/* Pipeline flow + Trend chart */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5 animate-fade-up" style={{ animationDelay: '250ms', animationFillMode: 'both' }}>
        <BentoCard className="xl:col-span-3">
          <StageCountGrid counts={stageCounts} />
        </BentoCard>
        <BentoCard className="xl:col-span-2 flex flex-col justify-center">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-4">Weekly Trend — last 8 weeks</p>
          <div className="-mx-2 h-[220px]">
            <WeeklyTrendChart data={trendData} />
          </div>
        </BentoCard>
      </div>

      {/* Today's summary + Monthly totals */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 animate-fade-up" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
        <BentoCard className="p-0 overflow-hidden">
          <TodaySummary entries={todayEntries} />
        </BentoCard>
        <BentoCard>
          <MonthlyTotals data={monthly} />
        </BentoCard>
      </div>
    </div>
  )
}
