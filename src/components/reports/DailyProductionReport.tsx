'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Download, FileText } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { exportToExcel } from '@/lib/utils/exportExcel'
import { BentoCard } from '@/components/shared/BentoCard'
import type { DateRange } from './DateRangePicker'
import type { ReactNode } from 'react'

type Row = {
  entry_date: string
  designs: number
  cut: number
  pe_send: number
  pe_recv: number
  swing_out: number
  swing_in: number
  qc_out: number
  reject: number
  alter: number
  spot: number
  finished: number
  dispatch: number
}

type Props = { range: DateRange; branchId?: string | null; headerControls?: ReactNode }

export default function DailyProductionReport({ range, branchId, headerControls }: Props) {
  const supabase = createClient()
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    let query = supabase
      .from('production_entries')
      .select('entry_date,cut_color_1,cut_color_2,cut_color_3,cut_color_4,cut_color_5,pe_sending_qty,pe_received_qty,swing_out_qty,swing_in_qty,qc_output_qty,qc_reject_qty,qc_alter_qty,qc_spot_qty,finished_goods_qty,dispatch_retail_qty,dispatch_wholesale_qty')
      .gte('entry_date', range.from)
      .lte('entry_date', range.to)
      .order('entry_date')
    if (branchId) query = query.eq('branch_id', branchId)
    query.then(({ data }) => {
        // Group by date
        const map = new Map<string, Row>()
        for (const e of data ?? []) {
          const d = e.entry_date
          if (!map.has(d)) map.set(d, { entry_date: d, designs: 0, cut: 0, pe_send: 0, pe_recv: 0, swing_out: 0, swing_in: 0, qc_out: 0, reject: 0, alter: 0, spot: 0, finished: 0, dispatch: 0 })
          const r = map.get(d)!
          r.designs++
          r.cut += (e.cut_color_1||0)+(e.cut_color_2||0)+(e.cut_color_3||0)+(e.cut_color_4||0)+(e.cut_color_5||0)
          r.pe_send += e.pe_sending_qty || 0
          r.pe_recv += e.pe_received_qty || 0
          r.swing_out += e.swing_out_qty || 0
          r.swing_in += e.swing_in_qty || 0
          r.qc_out += e.qc_output_qty || 0
          r.reject += e.qc_reject_qty || 0
          r.alter += e.qc_alter_qty || 0
          r.spot += e.qc_spot_qty || 0
          r.finished += e.finished_goods_qty || 0
          r.dispatch += (e.dispatch_retail_qty||0) + (e.dispatch_wholesale_qty||0)
        }
        setRows(Array.from(map.values()))
        setLoading(false)
      })
  }, [range, branchId, supabase])

  const totals = rows.reduce((a, r) => ({
    designs: a.designs + r.designs, cut: a.cut + r.cut, pe_send: a.pe_send + r.pe_send,
    pe_recv: a.pe_recv + r.pe_recv, swing_out: a.swing_out + r.swing_out, swing_in: a.swing_in + r.swing_in,
    qc_out: a.qc_out + r.qc_out, reject: a.reject + r.reject, alter: a.alter + r.alter,
    spot: a.spot + r.spot, finished: a.finished + r.finished, dispatch: a.dispatch + r.dispatch,
  }), { designs: 0, cut: 0, pe_send: 0, pe_recv: 0, swing_out: 0, swing_in: 0, qc_out: 0, reject: 0, alter: 0, spot: 0, finished: 0, dispatch: 0 })

  const handleExport = () => exportToExcel(`daily-production-${range.from}-to-${range.to}`, rows.map(r => ({
    Date: new Date(r.entry_date).toLocaleDateString(), Designs: r.designs, Cut: r.cut, 'PE Send': r.pe_send, 'PE Recv': r.pe_recv,
    'Swing OUT': r.swing_out, 'Swing IN': r.swing_in, 'QC Out': r.qc_out, Rejected: r.reject,
    Altered: r.alter, Spot: r.spot, Finished: r.finished, Dispatched: r.dispatch,
  })))

  const th = 'px-3 py-2 text-xs font-semibold text-slate-600 whitespace-nowrap text-right first:text-left'
  const td = 'px-3 py-2 text-xs text-slate-700 whitespace-nowrap text-right first:text-left'
  const n = (v: number) => v ? v.toLocaleString() : <span className="text-slate-300">—</span>

  return (
    <BentoCard noPadding className="flex flex-col">
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/50">
        <div>
          <h3 className="font-semibold text-slate-800">Daily Production Log</h3>
          <p className="text-xs text-slate-500 mt-1">{rows.length} day{rows.length !== 1 ? 's' : ''} of production data</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {headerControls}
          <Button variant="outline" onClick={handleExport} disabled={rows.length === 0}>
            <Download className="mr-2 h-4 w-4" /> Export Excel
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-max">
          <thead>
            <tr className="bg-slate-50 border-b">
              <th className={th}>Date</th>
              <th className={th}>Designs</th>
              <th className="px-3 py-2 text-xs font-semibold text-blue-600 whitespace-nowrap text-right">Cut</th>
              <th className="px-3 py-2 text-xs font-semibold text-teal-600 whitespace-nowrap text-right">PE Send</th>
              <th className="px-3 py-2 text-xs font-semibold text-teal-600 whitespace-nowrap text-right">PE Recv</th>
              <th className="px-3 py-2 text-xs font-semibold text-orange-600 whitespace-nowrap text-right">Swing OUT</th>
              <th className="px-3 py-2 text-xs font-semibold text-orange-600 whitespace-nowrap text-right">Swing IN</th>
              <th className="px-3 py-2 text-xs font-semibold text-green-600 whitespace-nowrap text-right">QC Out</th>
              <th className="px-3 py-2 text-xs font-semibold text-red-600 whitespace-nowrap text-right">Rejected</th>
              <th className="px-3 py-2 text-xs font-semibold text-red-500 whitespace-nowrap text-right">Altered</th>
              <th className="px-3 py-2 text-xs font-semibold text-red-400 whitespace-nowrap text-right">Spot</th>
              <th className="px-3 py-2 text-xs font-semibold text-purple-600 whitespace-nowrap text-right">Finished</th>
              <th className="px-3 py-2 text-xs font-semibold text-sky-600 whitespace-nowrap text-right">Dispatched</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({length:4}).map((_,i) => <tr key={i}><td colSpan={13} className="p-2"><Skeleton className="h-6 w-full"/></td></tr>)
              : rows.length === 0
              ? <tr><td colSpan={13} className="p-12 text-center">
                  <FileText className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-slate-900">No data available</p>
                  <p className="text-xs text-slate-500 mt-1">Try adjusting the date range.</p>
                </td></tr>
              : rows.map((r, i) => (
                <tr key={r.entry_date} className={i%2===0 ? 'bg-white border-b border-slate-50' : 'bg-slate-50 border-b border-slate-100'}>
                  <td className={td + ' font-medium'}>{format(parseISO(r.entry_date), 'dd MMM yyyy')}</td>
                  <td className={td}>{r.designs}</td>
                  <td className="px-3 py-2 text-xs text-blue-700 text-right font-medium">{n(r.cut)}</td>
                  <td className="px-3 py-2 text-xs text-teal-700 text-right">{n(r.pe_send)}</td>
                  <td className="px-3 py-2 text-xs text-teal-700 text-right">{n(r.pe_recv)}</td>
                  <td className="px-3 py-2 text-xs text-orange-700 text-right">{n(r.swing_out)}</td>
                  <td className="px-3 py-2 text-xs text-orange-700 text-right">{n(r.swing_in)}</td>
                  <td className="px-3 py-2 text-xs text-green-700 text-right">{n(r.qc_out)}</td>
                  <td className="px-3 py-2 text-xs text-red-700 text-right">{n(r.reject)}</td>
                  <td className="px-3 py-2 text-xs text-red-600 text-right">{n(r.alter)}</td>
                  <td className="px-3 py-2 text-xs text-red-500 text-right">{n(r.spot)}</td>
                  <td className="px-3 py-2 text-xs text-purple-700 text-right font-medium">{n(r.finished)}</td>
                  <td className="px-3 py-2 text-xs text-sky-700 text-right font-medium">{n(r.dispatch)}</td>
                </tr>
              ))
            }
          </tbody>
          {!loading && rows.length > 1 && (
            <tfoot>
              <tr className="bg-slate-700 text-white text-xs font-semibold">
                <td className="px-3 py-2">TOTAL</td>
                <td className="px-3 py-2 text-right">{totals.designs}</td>
                <td className="px-3 py-2 text-right">{totals.cut.toLocaleString()}</td>
                <td className="px-3 py-2 text-right">{totals.pe_send.toLocaleString()}</td>
                <td className="px-3 py-2 text-right">{totals.pe_recv.toLocaleString()}</td>
                <td className="px-3 py-2 text-right">{totals.swing_out.toLocaleString()}</td>
                <td className="px-3 py-2 text-right">{totals.swing_in.toLocaleString()}</td>
                <td className="px-3 py-2 text-right">{totals.qc_out.toLocaleString()}</td>
                <td className="px-3 py-2 text-right">{totals.reject.toLocaleString()}</td>
                <td className="px-3 py-2 text-right">{totals.alter.toLocaleString()}</td>
                <td className="px-3 py-2 text-right">{totals.spot.toLocaleString()}</td>
                <td className="px-3 py-2 text-right">{totals.finished.toLocaleString()}</td>
                <td className="px-3 py-2 text-right">{totals.dispatch.toLocaleString()}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </BentoCard>
  )
}
