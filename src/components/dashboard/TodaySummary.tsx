import type { ProductionEntry } from '@/types/app'

type Props = { entries: ProductionEntry[] }

export default function TodaySummary({ entries }: Props) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col h-full min-h-[300px]">
        <h2 className="text-sm font-bold text-slate-800 tracking-tight mb-4">Today&apos;s Operations</h2>
        <div className="flex-1 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 flex flex-col items-center justify-center text-slate-400 p-8">
          <svg className="w-12 h-12 mb-4 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-sm font-medium">No operations logged today</p>
          <p className="text-xs mt-1">Production entries will appear here</p>
        </div>
      </div>
    )
  }

  const sum = (field: keyof ProductionEntry) =>
    entries.reduce((s, e) => s + ((e[field] as number) || 0), 0)

  const cutTotal = sum('cut_color_1') + sum('cut_color_2') + sum('cut_color_3') + sum('cut_color_4') + sum('cut_color_5')

  const cols: { label: string; value: number; color: string }[] = [
    { label: 'Cut',         value: cutTotal,                   color: 'text-blue-600 font-semibold' },
    { label: 'PE Send',     value: sum('pe_sending_qty'),       color: 'text-teal-600' },
    { label: 'PE Recv',     value: sum('pe_received_qty'),      color: 'text-teal-600' },
    { label: 'Swing OUT',   value: sum('swing_out_qty'),        color: 'text-orange-600' },
    { label: 'Swing IN',    value: sum('swing_in_qty'),         color: 'text-orange-600' },
    { label: 'QC Pass',     value: sum('qc_output_qty'),        color: 'text-green-600 font-semibold' },
    { label: 'Reject',      value: sum('qc_reject_qty'),        color: 'text-red-600 font-semibold' },
    { label: 'Finished',    value: sum('finished_goods_qty'),   color: 'text-purple-600' },
    { label: 'Ret. Disp',   value: sum('dispatch_retail_qty'),  color: 'text-sky-600' },
    { label: 'Whl. Disp',   value: sum('dispatch_wholesale_qty'), color: 'text-sky-600' },
  ]

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-slate-800 tracking-tight">
          Today&apos;s Operations
        </h2>
        <span className="bg-brand/5 text-brand px-2 py-0.5 rounded-md text-[11px] font-bold tracking-wide">
          {entries.length} ACTIVE {entries.length !== 1 ? 'DESIGNS' : 'DESIGN'}
        </span>
      </div>
      
      <div className="rounded-xl border border-border/80 overflow-hidden overflow-x-auto shadow-sm">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-border/60">
              <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 sticky left-0 bg-slate-50/80 backdrop-blur-sm shadow-[1px_0_0_0_rgba(0,0,0,0.05)]">Design Code</th>
              {cols.map(c => (
                <th key={c.label} className="text-right px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {entries.map((e, i) => {
              const rowCut = (e.cut_color_1||0)+(e.cut_color_2||0)+(e.cut_color_3||0)+(e.cut_color_4||0)+(e.cut_color_5||0)
              const vals = [rowCut, e.pe_sending_qty, e.pe_received_qty, e.swing_out_qty, e.swing_in_qty,
                e.qc_output_qty, e.qc_reject_qty, e.finished_goods_qty, e.dispatch_retail_qty, e.dispatch_wholesale_qty]
              return (
                <tr key={e.id} className="group transition-colors hover:bg-slate-50 cursor-default">
                  <td className="px-4 py-2.5 font-mono text-[11px] font-bold text-slate-700 sticky left-0 bg-white group-hover:bg-slate-50 transition-colors shadow-[1px_0_0_0_rgba(0,0,0,0.05)]">
                    {e.design_code || '—'}
                  </td>
                  {vals.map((v, vi) => (
                    <td key={vi} className={`text-right px-3 py-2.5 text-[12px] tabular-nums ${v ? cols[vi].color : 'text-slate-300'}`}>
                      {v ? v.toLocaleString() : '—'}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="bg-slate-800 text-white shadow-inner">
              <td className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider sticky left-0 bg-slate-800 shadow-[1px_0_0_0_rgba(255,255,255,0.1)]">TOTAL DAY</td>
              {cols.map(c => (
                <td key={c.label} className="text-right px-3 py-3 text-[12px] font-bold tabular-nums">
                  {c.value ? c.value.toLocaleString() : '—'}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
