'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Download, FileText } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { exportToExcel } from '@/lib/utils/exportExcel'
import { BRANCHES } from '@/constants'
import { BentoCard } from '@/components/shared/BentoCard'
import type { DateRange } from './DateRangePicker'
import type { ReactNode } from 'react'

type DispatchRow = {
  branch_name: string
  product_code: string
  dispatch_date: string | null
  qty: number
  dispatch_no: number
}

type Props = { range: DateRange; selectedBranch?: string | null; headerControls?: ReactNode }

export default function BranchDispatchReport({ range, selectedBranch, headerControls }: Props) {
  const supabase = createClient()
  const [rows, setRows] = useState<DispatchRow[]>([])
  const [loading, setLoading] = useState(true)
  const [branchFilter, setBranchFilter] = useState('All')

  // Sync global branch selection into the internal filter
  useEffect(() => {
    setBranchFilter(selectedBranch ?? 'All')
  }, [selectedBranch])

  useEffect(() => {
    setLoading(true)
    supabase
      .from('branch_dispatch')
      .select('branch_name, dispatch_date, qty, dispatch_no, products(product_code)')
      .gte('dispatch_date', range.from)
      .lte('dispatch_date', range.to)
      .gt('qty', 0)
      .order('dispatch_date')
      .then(({ data }) => {
        setRows((data ?? []).map((d: Record<string, unknown>) => ({
          branch_name: d.branch_name as string,
          product_code: (d.products as Record<string, unknown>)?.product_code as string ?? '—',
          dispatch_date: d.dispatch_date as string | null,
          qty: d.qty as number,
          dispatch_no: d.dispatch_no as number,
        })))
        setLoading(false)
      })
  }, [range, supabase])

  const filtered = branchFilter === 'All' ? rows : rows.filter(r => r.branch_name === branchFilter)

  // Branch totals
  const branchTotals = BRANCHES.reduce((acc, b) => {
    acc[b] = rows.filter(r => r.branch_name === b).reduce((s, r) => s + r.qty, 0)
    return acc
  }, {} as Record<string, number>)

  const grandTotal = rows.reduce((s, r) => s + r.qty, 0)

  const handleExport = () => exportToExcel(`branch-dispatch-${range.from}-to-${range.to}`, filtered.map(r => ({
    Branch: r.branch_name, 'Design Code': r.product_code,
    'Dispatch Date': r.dispatch_date ?? '', 'Dispatch #': r.dispatch_no, QTY: r.qty,
  })))

  const th = 'px-3 py-2 text-xs font-semibold text-slate-600 whitespace-nowrap text-left'
  const td = 'px-3 py-2 text-xs text-slate-700 whitespace-nowrap'

  return (
    <BentoCard noPadding className="flex flex-col">
      <div className="p-6 border-b border-slate-100 flex flex-col gap-4 bg-white/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-slate-800">Branch Dispatch Log</h3>
            <p className="text-xs text-slate-500 mt-1">{filtered.length} dispatch record{filtered.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {headerControls}
            <Button size="sm" variant="outline" className="h-9 gap-2" onClick={handleExport} disabled={filtered.length === 0}>
              <Download className="h-4 w-4" /> Export Excel
            </Button>
          </div>
        </div>

        {/* Summary tiles */}
      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-7 gap-2">
        {BRANCHES.map(b => (
          <button key={b} onClick={() => setBranchFilter(branchFilter === b ? 'All' : b)}
            className={`rounded border p-2 text-left transition-all ${branchFilter === b ? 'border-[#1A3557] bg-blue-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
            <p className="text-xs font-medium text-slate-700 truncate">{b}</p>
            <p className={`text-base font-bold mt-0.5 ${branchTotals[b] > 0 ? 'text-sky-600' : 'text-slate-300'}`}>
              {branchTotals[b]?.toLocaleString() ?? '0'}
            </p>
          </button>
        ))}
        <div className="rounded border border-slate-700 bg-slate-700 p-2">
          <p className="text-xs font-medium text-white/70">TOTAL</p>
          <p className="text-base font-bold mt-0.5 text-white">{grandTotal.toLocaleString()}</p>
        </div>
      </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b">
              <th className={th}>Branch</th>
              <th className={th}>Design Code</th>
              <th className={th}>Dispatch Date</th>
              <th className={th + ' text-right'}>Dispatch #</th>
              <th className={th + ' text-right text-sky-600'}>QTY</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({length:5}).map((_,i)=><tr key={i}><td colSpan={5} className="p-2"><Skeleton className="h-6 w-full"/></td></tr>)
              : filtered.length === 0
              ? <tr><td colSpan={5} className="p-12 text-center">
                  <FileText className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-slate-900">No dispatches found</p>
                  <p className="text-xs text-slate-500 mt-1">No dispatch records for the selected branch/date.</p>
                </td></tr>
              : filtered.map((r, i) => (
                <tr key={i} className={i%2===0 ? 'bg-white border-b border-slate-50' : 'bg-slate-50 border-b border-slate-100'}>
                  <td className={td + ' font-medium'}>{r.branch_name}</td>
                  <td className={td + ' font-mono text-[#1A3557]'}>{r.product_code}</td>
                  <td className={td}>{r.dispatch_date ? format(parseISO(r.dispatch_date), 'dd MMM yyyy') : '—'}</td>
                  <td className={td + ' text-right'}>{r.dispatch_no}</td>
                  <td className="px-3 py-2 text-xs text-sky-700 text-right font-semibold">{r.qty.toLocaleString()}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </BentoCard>
  )
}
