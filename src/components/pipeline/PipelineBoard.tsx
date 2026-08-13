'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Download, AlertCircle, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { exportToExcel } from '@/lib/utils/exportExcel'
import { useRouter } from 'next/navigation'
import type { ProductStage } from '@/types/app'

const STAGE_STYLES: Record<ProductStage, string> = {
  Cutting:    'bg-blue-50 text-blue-700 border-blue-200/60',
  Printing:   'bg-teal-50 text-teal-700 border-teal-200/60',
  Sewing:     'bg-orange-50 text-orange-700 border-orange-200/60',
  QC:         'bg-green-50 text-green-700 border-green-200/60',
  Finishing:  'bg-purple-50 text-purple-700 border-purple-200/60',
  Dispatched: 'bg-sky-50 text-sky-700 border-sky-200/60',
  Completed:  'bg-slate-50 text-slate-600 border-slate-200/60',
}

type Row = {
  id: string; product_code: string; product_name: string; current_stage: ProductStage
  updated_at: string; cutting_total_qty: number | null; qc_out_qty: number | null
  qc_reject_qty: number | null; stock_total: number | null; total_dispatched: number | null
}

const STALE_DAYS = 7

export default function PipelineBoard() {
  const supabase = createClient()
  const router = useRouter()
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [staleOnly, setStaleOnly] = useState(false)

  useEffect(() => {
    supabase
      .from('product_summary')
      .select('id,product_code,product_name,current_stage,updated_at,cutting_total_qty,qc_out_qty,qc_reject_qty,stock_total,total_dispatched')
      .neq('current_stage', 'Completed')
      .order('updated_at', { ascending: true })
      .then(({ data }) => { setRows((data ?? []) as Row[]); setLoading(false) })
  }, [supabase])

  const isStale = (r: Row) => {
    const diff = (Date.now() - new Date(r.updated_at).getTime()) / (1000 * 60 * 60 * 24)
    return diff >= STALE_DAYS
  }

  const rejectRate = (r: Row) => {
    const denom = (r.qc_out_qty || 0) + (r.qc_reject_qty || 0)
    if (!denom || !r.qc_reject_qty) return null
    return ((r.qc_reject_qty / denom) * 100).toFixed(1) + '%'
  }

  const filtered = staleOnly ? rows.filter(isStale) : rows
  const staleCount = rows.filter(isStale).length

  const handleExport = () => exportToExcel('active-pipeline', filtered.map(r => ({
    Code: r.product_code, Name: r.product_name, Stage: r.current_stage,
    'Cut Qty': r.cutting_total_qty ?? 0, 'QC Out': r.qc_out_qty ?? 0,
    'Reject %': rejectRate(r) ?? '0%',
    Stock: r.stock_total ?? 0, 'Last Update': r.updated_at,
    Stale: isStale(r) ? 'YES' : 'no',
  })))

  const th = 'px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap text-left sticky top-0 bg-slate-50/95 backdrop-blur-sm shadow-[0_1px_0_0_rgba(0,0,0,0.05)] z-10 transition-colors'
  const td = 'px-4 py-3 text-sm text-foreground whitespace-nowrap align-middle'

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-white/50 p-3 rounded-xl border border-border/50">
        <div className="flex items-center gap-4 flex-wrap px-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-foreground tabular-nums bg-primary/10 text-primary px-2 py-0.5 rounded-md">{rows.length}</span>
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">active designs</span>
          </div>
          {staleCount > 0 && (
            <>
              <div className="h-4 w-px bg-border/60 hidden sm:block" />
              <button
                onClick={() => setStaleOnly(!staleOnly)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all shadow-sm ${
                  staleOnly
                    ? 'bg-amber-500 text-white shadow-amber-500/20'
                    : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50 hover:border-amber-300 hover:shadow-md'
                }`}
              >
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {staleCount} stale (&gt;{STALE_DAYS}d)
                <span className="opacity-70 font-medium ml-1">{staleOnly ? '— show all' : ''}</span>
              </button>
            </>
          )}
        </div>
        <Button size="sm" variant="outline" className="h-8 text-xs gap-2 font-bold bg-white" onClick={handleExport} disabled={filtered.length === 0}>
          <Download className="h-3.5 w-3.5" /> Export Excel
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-border/80 overflow-hidden shadow-sm flex flex-col max-h-[600px]">
        <div className="overflow-x-auto overflow-y-auto flex-1">
          <table className="w-full border-collapse min-w-max relative">
            <thead>
              <tr>
                <th className={`${th} shadow-[1px_1px_0_0_rgba(0,0,0,0.05)] sticky left-0 z-20 w-[120px]`}>Code</th>
                <th className={th}>Name</th>
                <th className={th}>Stage</th>
                <th className={th + ' text-right'} style={{ color: '#2563EB' }}>Cut</th>
                <th className={th + ' text-right'} style={{ color: '#16A34A' }}>QC Pass</th>
                <th className={th + ' text-right'} style={{ color: '#DC2626' }}>Reject %</th>
                <th className={th + ' text-right'} style={{ color: '#0EA5E9' }}>Dispatched</th>
                <th className={th + ' text-right'}>Stock</th>
                <th className={th}>Last Updated</th>
                <th className={th}></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={10} className="p-4">
                        <Skeleton className="h-8 w-full rounded-md" />
                      </td>
                    </tr>
                  ))
                : filtered.length === 0
                ? (
                  <tr>
                    <td colSpan={10} className="py-24 text-center">
                      <p className="text-sm font-semibold text-muted-foreground bg-muted/30 py-4 px-6 rounded-lg inline-block border border-dashed border-border/60">
                        {staleOnly ? 'No stale products — all up to date' : 'No active designs — all completed'}
                      </p>
                    </td>
                  </tr>
                )
                : filtered.map(r => {
                    const stale = isStale(r)
                    const rate = rejectRate(r)
                    const rateNum = rate ? parseFloat(rate) : 0
                    return (
                      <tr
                        key={r.id}
                        onClick={() => router.push(`/dashboard/products/${r.id}`)}
                        className={`group transition-all duration-200 cursor-pointer ${
                          stale ? 'bg-amber-50/30 hover:bg-amber-50/80' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className={`${td} font-mono font-bold text-foreground shadow-[1px_0_0_0_rgba(0,0,0,0.05)] sticky left-0 z-10 transition-colors ${stale ? 'bg-amber-50/50 group-hover:bg-amber-100/50' : 'bg-white group-hover:bg-slate-50'}`}>
                          {r.product_code}
                        </td>
                        <td className={`${td} max-w-[180px] truncate font-medium text-slate-600`}>{r.product_name}</td>
                        <td className={td}>
                          <Badge variant="outline" className={`text-[10px] font-bold px-2 py-0.5 border ${STAGE_STYLES[r.current_stage]}`}>
                            {r.current_stage}
                          </Badge>
                        </td>
                        <td className={`${td} text-right font-bold text-blue-600 tabular-nums`}>
                          {r.cutting_total_qty?.toLocaleString() ?? '—'}
                        </td>
                        <td className={`${td} text-right font-bold text-green-600 tabular-nums`}>
                          {r.qc_out_qty?.toLocaleString() ?? '—'}
                        </td>
                        <td className={`${td} text-right tabular-nums font-bold ${rateNum > 5 ? 'text-red-600' : rateNum > 0 ? 'text-orange-600' : 'text-slate-400'}`}>
                          {rate ?? '—'}
                        </td>
                        <td className={`${td} text-right font-bold text-sky-600 tabular-nums`}>
                          {r.total_dispatched ? r.total_dispatched.toLocaleString() : '—'}
                        </td>
                        <td className={`${td} text-right tabular-nums font-medium text-slate-500`}>
                          {r.stock_total?.toLocaleString() ?? '—'}
                        </td>
                        <td className={td}>
                          <span className={`flex items-center gap-1.5 text-xs font-medium ${stale ? 'text-amber-600' : 'text-slate-400'}`}>
                            {stale && <AlertCircle className="h-3.5 w-3.5 shrink-0" />}
                            {formatDistanceToNow(parseISO(r.updated_at), { addSuffix: true })}
                          </span>
                        </td>
                        <td className={td}>
                          <Link
                            href={`/dashboard/products/${r.id}`}
                            onClick={e => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wider font-bold text-primary hover:text-primary/80 transition-colors opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 duration-200"
                          >
                            Open <ArrowUpRight className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    )
                  })
              }
            </tbody>
          </table>
        </div>
      </div>

      {!loading && filtered.length > 0 && (
        <p className="text-xs font-bold text-slate-400 text-right tabular-nums tracking-wide">
          SHOWING {filtered.length} OF {rows.length} ACTIVE DESIGN{rows.length !== 1 ? 'S' : ''}
        </p>
      )}
    </div>
  )
}
