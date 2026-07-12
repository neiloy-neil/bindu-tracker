'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Download, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { exportToExcel } from '@/lib/utils/exportExcel'
import type { ProductStage } from '@/types/app'

const STAGE_COLORS: Record<ProductStage, string> = {
  Cutting: 'bg-blue-100 text-blue-700', Printing: 'bg-teal-100 text-teal-700',
  Sewing: 'bg-orange-100 text-orange-700', QC: 'bg-green-100 text-green-700',
  Finishing: 'bg-purple-100 text-purple-700', Dispatched: 'bg-sky-100 text-sky-700',
  Completed: 'bg-slate-100 text-slate-600',
}

type Row = {
  id: string; product_code: string; product_name: string; current_stage: ProductStage
  updated_at: string; cutting_total_qty: number | null; qc_out_qty: number | null
  qc_reject_qty: number | null; stock_total: number | null; total_dispatched: number | null
}

const STALE_DAYS = 3

export default function PipelineBoard() {
  const supabase = createClient()
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

  const th = 'px-3 py-2 text-xs font-semibold text-slate-600 whitespace-nowrap text-left'
  const td = 'px-3 py-2 text-xs text-slate-700 whitespace-nowrap align-middle'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <p className="text-sm text-slate-500">
            <span className="font-semibold text-slate-700">{rows.length}</span> active designs
            {staleCount > 0 && (
              <span className="ml-3 text-red-600 font-medium flex items-center gap-1 inline-flex">
                <AlertCircle className="h-3.5 w-3.5" />
                {staleCount} stale (&gt;{STALE_DAYS} days)
              </span>
            )}
          </p>
          {staleCount > 0 && (
            <button
              onClick={() => setStaleOnly(!staleOnly)}
              className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${staleOnly ? 'bg-red-600 text-white' : 'bg-red-50 text-red-600 border border-red-200'}`}>
              {staleOnly ? 'Show All' : 'Show Stale Only'}
            </button>
          )}
        </div>
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={handleExport} disabled={filtered.length === 0}>
          <Download className="h-3 w-3" /> Export Excel
        </Button>
      </div>

      <div className="rounded-lg border bg-white overflow-x-auto shadow-sm">
        <table className="w-full border-collapse min-w-max">
          <thead>
            <tr className="bg-slate-50 border-b">
              <th className={th}>Code</th>
              <th className={th}>Name</th>
              <th className={th}>Stage</th>
              <th className={th + ' text-right text-blue-600'}>Cut</th>
              <th className={th + ' text-right text-green-600'}>QC Out</th>
              <th className={th + ' text-right text-red-600'}>Reject %</th>
              <th className={th + ' text-right text-sky-600'}>Dispatched</th>
              <th className={th + ' text-right'}>Stock</th>
              <th className={th}>Last Update</th>
              <th className={th}></th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({length:6}).map((_,i)=><tr key={i}><td colSpan={10} className="p-2"><Skeleton className="h-7 w-full"/></td></tr>)
              : filtered.length === 0
              ? <tr><td colSpan={10} className="p-8 text-center text-sm text-slate-400">
                  {staleOnly ? 'No stale products' : 'No active designs — all are completed'}
                </td></tr>
              : filtered.map((r, i) => {
                const stale = isStale(r)
                return (
                  <tr key={r.id} className={`border-b ${stale ? 'bg-red-50/40' : i%2===0 ? 'bg-white' : 'bg-slate-50'} hover:bg-blue-50/30 transition-colors`}>
                    <td className={td + ' font-mono font-medium text-[#1A3557]'}>{r.product_code}</td>
                    <td className={td}>{r.product_name}</td>
                    <td className={td}>
                      <Badge variant="secondary" className={`text-xs ${STAGE_COLORS[r.current_stage]}`}>{r.current_stage}</Badge>
                    </td>
                    <td className={td + ' text-right text-blue-700 font-medium'}>{r.cutting_total_qty?.toLocaleString() ?? '—'}</td>
                    <td className={td + ' text-right text-green-700'}>{r.qc_out_qty?.toLocaleString() ?? '—'}</td>
                    <td className={td + ' text-right text-red-600 font-medium'}>{rejectRate(r) ?? '—'}</td>
                    <td className={td + ' text-right text-sky-700 font-semibold'}>{r.total_dispatched ? r.total_dispatched.toLocaleString() : '—'}</td>
                    <td className={td + ' text-right'}>{r.stock_total?.toLocaleString() ?? '—'}</td>
                    <td className={td}>
                      <span className={`flex items-center gap-1 ${stale ? 'text-red-600 font-medium' : 'text-slate-400'}`}>
                        {stale && <AlertCircle className="h-3 w-3 shrink-0" />}
                        {formatDistanceToNow(parseISO(r.updated_at), { addSuffix: true })}
                      </span>
                    </td>
                    <td className={td}>
                      <Link href={`/dashboard/products/${r.id}`} className="text-xs text-[#1A3557] hover:underline font-medium">View →</Link>
                    </td>
                  </tr>
                )
              })
            }
          </tbody>
        </table>
      </div>
    </div>
  )
}
