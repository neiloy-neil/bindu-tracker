export type MonthlySummaryAgg = {
  total_cutting: number
  total_pe_sending: number
  total_pe_received: number
  total_swing_out: number
  total_swing_in: number
  total_qc_output: number
  total_reject: number
  total_alter: number
  total_finished: number
  total_retail: number
  total_wholesale: number
}

type Props = { data: MonthlySummaryAgg | null }

const COLS: { label: string; key: keyof MonthlySummaryAgg; color: string }[] = [
  { label: 'Cut',        key: 'total_cutting',     color: 'text-blue-600' },
  { label: 'PE Send',    key: 'total_pe_sending',  color: 'text-teal-600' },
  { label: 'PE Recv',    key: 'total_pe_received', color: 'text-teal-600' },
  { label: 'Swing OUT',  key: 'total_swing_out',   color: 'text-orange-600' },
  { label: 'Swing IN',   key: 'total_swing_in',    color: 'text-orange-600' },
  { label: 'QC Out',     key: 'total_qc_output',   color: 'text-green-600' },
  { label: 'Rejected',   key: 'total_reject',      color: 'text-red-600' },
  { label: 'Altered',    key: 'total_alter',       color: 'text-red-500' },
  { label: 'Finished',   key: 'total_finished',    color: 'text-purple-600' },
  { label: 'Retail',     key: 'total_retail',      color: 'text-sky-600' },
  { label: 'Wholesale',  key: 'total_wholesale',   color: 'text-sky-600' },
]

export default function MonthlyTotals({ data }: Props) {
  return (
    <div className="flex flex-col h-full">
      <h2 className="text-sm font-semibold text-slate-700 mb-4">Monthly Totals</h2>
      <div className="rounded-xl border border-slate-200/60 overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-max">
          <thead>
            <tr className="bg-slate-50 border-b">
              {COLS.map(c => (
                <th key={c.key} className="text-right px-4 py-2 font-semibold text-slate-500 text-xs whitespace-nowrap">{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {COLS.map(c => {
                const val = data ? (data[c.key] as number) : 0
                return (
                  <td key={c.key} className={`text-right px-4 py-3 font-semibold ${c.color}`}>
                    {val ? val.toLocaleString() : <span className="text-slate-300 font-normal">—</span>}
                  </td>
                )
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
