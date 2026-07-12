'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Download, FileText } from 'lucide-react'
import { exportToExcel } from '@/lib/utils/exportExcel'
import { BentoCard } from '@/components/shared/BentoCard'
import type { DateRange } from './DateRangePicker'
import type { ReactNode } from 'react'

type Row = {
  design_code: string
  qc_recv: number
  qc_out: number
  reject: number
  alter: number
  spot: number
  total_defects: number
  dhu: string
  reject_rate: string
}

type Props = { range: DateRange; branchId?: string | null; headerControls?: ReactNode }

export default function RejectionReport({ range, branchId, headerControls }: Props) {
  const supabase = createClient()
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    let query = supabase
      .from('production_entries')
      .select('design_code,qc_received_qty,qc_output_qty,qc_reject_qty,qc_alter_qty,qc_spot_qty')
      .gte('entry_date', range.from)
      .lte('entry_date', range.to)
    if (branchId) query = query.eq('branch_id', branchId)
    query.then(({ data }) => {
        const map = new Map<string, { recv: number; out: number; reject: number; alter: number; spot: number }>()
        for (const e of data ?? []) {
          const code = e.design_code || '(blank)'
          if (!map.has(code)) map.set(code, { recv: 0, out: 0, reject: 0, alter: 0, spot: 0 })
          const r = map.get(code)!
          r.recv += e.qc_received_qty || 0
          r.out += e.qc_output_qty || 0
          r.reject += e.qc_reject_qty || 0
          r.alter += e.qc_alter_qty || 0
          r.spot += e.qc_spot_qty || 0
        }
        const result: Row[] = Array.from(map.entries())
          .filter(([, v]) => v.reject + v.alter + v.spot > 0)
          .map(([code, v]) => {
            const total = v.reject + v.alter + v.spot
            const checked = v.recv || 1
            return {
              design_code: code,
              qc_recv: v.recv, qc_out: v.out,
              reject: v.reject, alter: v.alter, spot: v.spot,
              total_defects: total,
              dhu: ((total / checked) * 100).toFixed(2),
              reject_rate: v.recv > 0 ? ((v.reject / v.recv) * 100).toFixed(1) + '%' : '—',
            }
          })
          .sort((a, b) => b.total_defects - a.total_defects)
        setRows(result)
        setLoading(false)
      })
  }, [range, branchId, supabase])

  const handleExport = () => exportToExcel(`rejection-analysis-${range.from}-to-${range.to}`, rows.map(r => ({
    'Design Code': r.design_code, 'QC Recv': r.qc_recv, 'QC Out': r.qc_out,
    Rejected: r.reject, Altered: r.alter, Spot: r.spot, 'Total Defects': r.total_defects,
    'DHU': r.dhu, 'Reject Rate': r.reject_rate,
  })))

  const th = 'px-3 py-2 text-xs font-semibold text-slate-600 whitespace-nowrap'
  const td = 'px-3 py-2 text-xs text-slate-700 whitespace-nowrap'

  return (
    <BentoCard noPadding className="flex flex-col">
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between gap-4 bg-white/50">
        <div>
          <h3 className="font-semibold text-slate-800">Rejection & DHU Analysis</h3>
          <p className="text-xs text-slate-500 mt-1">{rows.length} design code{rows.length !== 1 ? 's' : ''} with defects — sorted by total defects</p>
          <p className="text-xs text-slate-400 mt-0.5">DHU = (total defects / pieces checked) × 100</p>
        </div>
        <div className="flex items-start md:items-center gap-2 flex-wrap">
          {headerControls}
          <Button size="sm" variant="outline" className="h-9 gap-2" onClick={handleExport} disabled={rows.length === 0}>
            <Download className="h-4 w-4" /> Export Excel
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-max">
          <thead>
            <tr className="bg-slate-50 border-b">
              <th className={th + ' text-left'}>Design Code</th>
              <th className={th + ' text-right'}>QC Recv</th>
              <th className={th + ' text-right'}>QC Out</th>
              <th className="px-3 py-2 text-xs font-semibold text-red-700 whitespace-nowrap text-right">Rejected</th>
              <th className="px-3 py-2 text-xs font-semibold text-red-500 whitespace-nowrap text-right">Altered</th>
              <th className="px-3 py-2 text-xs font-semibold text-orange-500 whitespace-nowrap text-right">Spot</th>
              <th className={th + ' text-right'}>Total Defects</th>
              <th className="px-3 py-2 text-xs font-semibold text-red-600 whitespace-nowrap text-right">DHU</th>
              <th className="px-3 py-2 text-xs font-semibold text-red-600 whitespace-nowrap text-right">Reject %</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({length:4}).map((_,i)=><tr key={i}><td colSpan={9} className="p-2"><Skeleton className="h-6 w-full"/></td></tr>)
              : rows.length === 0
              ? <tr><td colSpan={9} className="p-12 text-center">
                  <FileText className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-slate-900">No defects recorded</p>
                  <p className="text-xs text-slate-500 mt-1">No rejected, altered, or spot items found in this date range.</p>
                </td></tr>
              : rows.map((r, i) => (
                <tr key={r.design_code} className={i%2===0 ? 'bg-white border-b border-slate-50' : 'bg-slate-50 border-b border-slate-100'}>
                  <td className={td + ' font-mono font-medium'}>{r.design_code}</td>
                  <td className={td + ' text-right'}>{r.qc_recv.toLocaleString()}</td>
                  <td className={td + ' text-right'}>{r.qc_out.toLocaleString()}</td>
                  <td className="px-3 py-2 text-xs text-red-700 text-right font-medium">{r.reject.toLocaleString()}</td>
                  <td className="px-3 py-2 text-xs text-red-500 text-right">{r.alter.toLocaleString()}</td>
                  <td className="px-3 py-2 text-xs text-orange-500 text-right">{r.spot.toLocaleString()}</td>
                  <td className={td + ' text-right font-semibold'}>{r.total_defects.toLocaleString()}</td>
                  <td className="px-3 py-2 text-xs text-red-600 text-right font-bold">{r.dhu}</td>
                  <td className="px-3 py-2 text-xs text-red-600 text-right font-medium">{r.reject_rate}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </BentoCard>
  )
}
