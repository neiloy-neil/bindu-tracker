'use client'
import { formatDate } from '@/lib/utils/formatters'
import Link from 'next/link'
import { Calendar } from 'lucide-react'

type DailyRow = {
  entry_date: string
  cut_total: number
  pe_sending_qty: number
  pe_received_qty: number
  swing_out_qty: number
  swing_in_qty: number
  qc_received_qty: number
  qc_output_qty: number
  qc_reject_qty: number
  finished_goods_qty: number
  dispatch_retail_qty: number
  dispatch_wholesale_qty: number
}

export type { DailyRow }

export default function ProductActivityPanel({ rows }: { rows: DailyRow[] }) {
  if (!rows.length) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-5 py-3 border-b flex items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-semibold text-slate-700">Daily Production Activity</span>
          <span className="text-xs text-slate-400 ml-1">— from linked daily entries</span>
        </div>
        <p className="px-5 py-6 text-sm text-slate-400 text-center">
          No daily entries linked to this design yet.{' '}
          <Link href="/dashboard/daily" className="text-blue-600 hover:underline">Go to Daily Entry →</Link>
        </p>
      </div>
    )
  }

  const totals = rows.reduce((acc, r) => ({
    cut: acc.cut + r.cut_total,
    pe_out: acc.pe_out + r.pe_sending_qty,
    pe_in: acc.pe_in + r.pe_received_qty,
    swing_out: acc.swing_out + r.swing_out_qty,
    swing_in: acc.swing_in + r.swing_in_qty,
    qc_recv: acc.qc_recv + r.qc_received_qty,
    qc_out: acc.qc_out + r.qc_output_qty,
    reject: acc.reject + r.qc_reject_qty,
    finished: acc.finished + r.finished_goods_qty,
    dispatch: acc.dispatch + r.dispatch_retail_qty + r.dispatch_wholesale_qty,
  }), { cut: 0, pe_out: 0, pe_in: 0, swing_out: 0, swing_in: 0, qc_recv: 0, qc_out: 0, reject: 0, finished: 0, dispatch: 0 })

  const th = 'px-3 py-2 text-xs font-semibold text-slate-500 whitespace-nowrap text-right first:text-left'
  const td = 'px-3 py-2 text-xs text-slate-700 text-right first:text-left whitespace-nowrap'
  const ttd = 'px-3 py-2 text-xs font-bold text-right first:text-left whitespace-nowrap'

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-3 border-b flex items-center gap-2">
        <Calendar className="h-4 w-4 text-slate-400" />
        <span className="text-sm font-semibold text-slate-700">Daily Production Activity</span>
        <span className="text-xs text-slate-400 ml-1">— {rows.length} day{rows.length !== 1 ? 's' : ''} of linked entries</span>
        <Link href="/dashboard/daily" className="ml-auto text-xs text-blue-600 hover:underline">Add entry →</Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-max">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className={th}>Date</th>
              <th className={th + ' text-blue-600'}>Cut</th>
              <th className={th + ' text-teal-600'}>PE Out</th>
              <th className={th + ' text-teal-600'}>PE In</th>
              <th className={th + ' text-orange-600'}>Swing Out</th>
              <th className={th + ' text-orange-600'}>Swing In</th>
              <th className={th + ' text-green-600'}>QC Recv</th>
              <th className={th + ' text-green-600'}>QC Out</th>
              <th className={th + ' text-red-600'}>Reject</th>
              <th className={th + ' text-purple-600'}>Finished</th>
              <th className={th + ' text-sky-600'}>Dispatched</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(r => (
              <tr key={r.entry_date} className="hover:bg-slate-50 transition-colors">
                <td className={td + ' font-medium'}>{formatDate(r.entry_date)}</td>
                <td className={td + ' text-blue-700 font-medium'}>{r.cut_total || '—'}</td>
                <td className={td}>{r.pe_sending_qty || '—'}</td>
                <td className={td}>{r.pe_received_qty || '—'}</td>
                <td className={td}>{r.swing_out_qty || '—'}</td>
                <td className={td}>{r.swing_in_qty || '—'}</td>
                <td className={td}>{r.qc_received_qty || '—'}</td>
                <td className={td}>{r.qc_output_qty || '—'}</td>
                <td className={td + ' text-red-600'}>{r.qc_reject_qty || '—'}</td>
                <td className={td}>{r.finished_goods_qty || '—'}</td>
                <td className={td + ' text-sky-700 font-medium'}>{(r.dispatch_retail_qty + r.dispatch_wholesale_qty) || '—'}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-700 text-white">
              <td className={ttd}>TOTAL</td>
              <td className={ttd + ' text-blue-200'}>{totals.cut || '—'}</td>
              <td className={ttd}>{totals.pe_out || '—'}</td>
              <td className={ttd}>{totals.pe_in || '—'}</td>
              <td className={ttd}>{totals.swing_out || '—'}</td>
              <td className={ttd}>{totals.swing_in || '—'}</td>
              <td className={ttd}>{totals.qc_recv || '—'}</td>
              <td className={ttd}>{totals.qc_out || '—'}</td>
              <td className={ttd + ' text-red-300'}>{totals.reject || '—'}</td>
              <td className={ttd}>{totals.finished || '—'}</td>
              <td className={ttd + ' text-sky-200'}>{totals.dispatch || '—'}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
