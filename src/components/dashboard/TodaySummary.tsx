import type { ProductionEntry } from '@/types/app'

type Props = { entries: ProductionEntry[] }

export default function TodaySummary({ entries }: Props) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Today&apos;s Summary</h2>
        <div className="flex-1 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 flex items-center justify-center text-sm text-slate-400">
          No entries logged today
        </div>
      </div>
    )
  }

  const sum = (field: keyof ProductionEntry) =>
    entries.reduce((s, e) => s + ((e[field] as number) || 0), 0)

  const cutTotal = sum('cut_color_1') + sum('cut_color_2') + sum('cut_color_3') + sum('cut_color_4') + sum('cut_color_5')

  const cols: { label: string; value: number; color: string }[] = [
    { label: 'Cut',         value: cutTotal,                   color: 'text-blue-600' },
    { label: 'PE Send',     value: sum('pe_sending_qty'),       color: 'text-teal-600' },
    { label: 'PE Recv',     value: sum('pe_received_qty'),      color: 'text-teal-600' },
    { label: 'Swing OUT',   value: sum('swing_out_qty'),        color: 'text-orange-600' },
    { label: 'Swing IN',    value: sum('swing_in_qty'),         color: 'text-orange-600' },
    { label: 'QC Out',      value: sum('qc_output_qty'),        color: 'text-green-600' },
    { label: 'Rejected',    value: sum('qc_reject_qty'),        color: 'text-red-600' },
    { label: 'Finished',    value: sum('finished_goods_qty'),   color: 'text-purple-600' },
    { label: 'Retail Disp', value: sum('dispatch_retail_qty'),  color: 'text-sky-600' },
    { label: 'Whlsl Disp',  value: sum('dispatch_wholesale_qty'), color: 'text-sky-600' },
  ]

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-sm font-semibold text-slate-700 mb-4">
        Today&apos;s Summary
        <span className="ml-2 text-xs font-normal text-slate-400">{entries.length} design{entries.length !== 1 ? 's' : ''} logged</span>
      </h2>
      <div className="rounded-xl border border-slate-200/60 overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b">
              <th className="text-left px-4 py-2 font-semibold text-slate-600">Design Code</th>
              {cols.map(c => (
                <th key={c.label} className="text-right px-3 py-2 font-semibold text-slate-500 text-xs whitespace-nowrap">{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {entries.map((e, i) => {
              const rowCut = (e.cut_color_1||0)+(e.cut_color_2||0)+(e.cut_color_3||0)+(e.cut_color_4||0)+(e.cut_color_5||0)
              const vals = [rowCut, e.pe_sending_qty, e.pe_received_qty, e.swing_out_qty, e.swing_in_qty,
                e.qc_output_qty, e.qc_reject_qty, e.finished_goods_qty, e.dispatch_retail_qty, e.dispatch_wholesale_qty]
              return (
                <tr key={e.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="px-4 py-2 font-mono text-xs font-medium text-slate-700">{e.design_code || '—'}</td>
                  {vals.map((v, vi) => (
                    <td key={vi} className={`text-right px-3 py-2 text-xs font-medium ${cols[vi].color}`}>
                      {v ? v.toLocaleString() : <span className="text-slate-300">—</span>}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="bg-slate-700 text-white font-semibold text-xs">
              <td className="px-4 py-2">TOTAL</td>
              {cols.map(c => (
                <td key={c.label} className="text-right px-3 py-2">{c.value ? c.value.toLocaleString() : '—'}</td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
