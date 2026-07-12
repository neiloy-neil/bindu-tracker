'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Download, FileText } from 'lucide-react'
import Link from 'next/link'
import { exportToExcel } from '@/lib/utils/exportExcel'
import { BentoCard } from '@/components/shared/BentoCard'
import type { ProductStage } from '@/types/app'

const STAGE_COLORS: Record<ProductStage, string> = {
  Cutting: 'bg-blue-100 text-blue-700', Printing: 'bg-teal-100 text-teal-700',
  Sewing: 'bg-orange-100 text-orange-700', QC: 'bg-green-100 text-green-700',
  Finishing: 'bg-purple-100 text-purple-700', Dispatched: 'bg-sky-100 text-sky-700',
  Completed: 'bg-slate-100 text-slate-600',
}

type Row = {
  id: string; product_code: string; product_name: string; current_stage: ProductStage
  cutting_total_qty: number | null; print_status: string | null; sew_status: string | null
  qc_status: string | null; qc_output_qty: number | null; qc_reject_qty: number | null
  total_dispatched: number | null; stock_total: number | null
}

export default function DesignProgressReport() {
  const supabase = createClient()
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [stageFilter, setStageFilter] = useState('all')

  useEffect(() => {
    supabase.from('product_summary').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { setRows((data ?? []) as Row[]); setLoading(false) })
  }, [supabase])

  const filtered = stageFilter === 'all' ? rows : rows.filter(r => r.current_stage === stageFilter)

  const rejectRate = (r: Row) => {
    const denom = (r.qc_output_qty || 0) + (r.qc_reject_qty || 0)
    if (!denom || !r.qc_reject_qty) return null
    return ((r.qc_reject_qty / denom) * 100).toFixed(1) + '%'
  }

  const handleExport = () => exportToExcel('design-progress', filtered.map(r => ({
    Code: r.product_code, Name: r.product_name, Stage: r.current_stage,
    'Cut Qty': r.cutting_total_qty ?? 0, 'PE Status': r.print_status ?? '',
    'Sew Status': r.sew_status ?? '', 'QC Status': r.qc_status ?? '',
    'QC Out': r.qc_output_qty ?? 0, 'Reject %': rejectRate(r) ?? '0%',
    Dispatched: r.total_dispatched ?? 0, Stock: r.stock_total ?? 0,
  })))

  const stages = ['all','Cutting','Printing','Sewing','QC','Finishing','Dispatched','Completed']
  const th = 'px-3 py-2 text-xs font-semibold text-slate-600 whitespace-nowrap text-left'
  const td = 'px-3 py-2 text-xs text-slate-700 whitespace-nowrap'

  return (
    <BentoCard noPadding className="flex flex-col">
      <div className="p-6 border-b border-slate-100 flex flex-col gap-4 bg-white/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-slate-800">Design Progress Log</h3>
            <p className="text-xs text-slate-500 mt-1">{filtered.length} design{filtered.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button size="sm" variant="outline" className="h-9 gap-2" onClick={handleExport} disabled={filtered.length === 0}>
              <Download className="h-4 w-4" /> Export Excel
            </Button>
          </div>
        </div>
        <div className="flex gap-1 flex-wrap">
          {stages.map(s => (
            <button key={s} onClick={() => setStageFilter(s)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${stageFilter === s ? 'bg-[#1A3557] text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {s === 'all' ? 'All Stages' : s}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-max">
          <thead>
            <tr className="bg-slate-50 border-b">
              <th className={th}>Code</th>
              <th className={th}>Name</th>
              <th className={th}>Stage</th>
              <th className={th + ' text-right'}>Cut Qty</th>
              <th className={th}>PE Status</th>
              <th className={th}>Sew Status</th>
              <th className={th}>QC Status</th>
              <th className={th + ' text-right'}>QC Out</th>
              <th className={th + ' text-right text-red-600'}>Reject %</th>
              <th className={th + ' text-right'}>Dispatched</th>
              <th className={th + ' text-right'}>Stock</th>
              <th className={th}></th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({length:5}).map((_,i)=><tr key={i}><td colSpan={12} className="p-2"><Skeleton className="h-6 w-full"/></td></tr>)
              : filtered.length === 0
              ? <tr><td colSpan={12} className="p-12 text-center">
                  <FileText className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-slate-900">No designs found</p>
                  <p className="text-xs text-slate-500 mt-1">Try selecting a different stage filter.</p>
                </td></tr>
              : filtered.map((r, i) => (
                <tr key={r.id} className={i%2===0 ? 'bg-white border-b border-slate-50' : 'bg-slate-50 border-b border-slate-100'}>
                  <td className={td + ' font-mono font-medium text-[#1A3557]'}>{r.product_code}</td>
                  <td className={td}>{r.product_name}</td>
                  <td className={td}><Badge variant="secondary" className={`text-xs ${STAGE_COLORS[r.current_stage]}`}>{r.current_stage}</Badge></td>
                  <td className={td + ' text-right font-medium'}>{r.cutting_total_qty ?? '—'}</td>
                  <td className={td}>{r.print_status ? <Badge variant="secondary" className="text-xs">{r.print_status}</Badge> : '—'}</td>
                  <td className={td}>{r.sew_status ? <Badge variant="secondary" className="text-xs">{r.sew_status}</Badge> : '—'}</td>
                  <td className={td}>{r.qc_status ? <Badge variant="secondary" className="text-xs">{r.qc_status}</Badge> : '—'}</td>
                  <td className={td + ' text-right'}>{r.qc_output_qty ?? '—'}</td>
                  <td className={td + ' text-right text-red-600 font-medium'}>{rejectRate(r) ?? '—'}</td>
                  <td className={td + ' text-right text-sky-700 font-medium'}>{r.total_dispatched ?? '—'}</td>
                  <td className={td + ' text-right'}>{r.stock_total ?? '—'}</td>
                  <td className={td}><Link href={`/dashboard/products/${r.id}`} className="text-xs text-[#1A3557] hover:underline">View →</Link></td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </BentoCard>
  )
}
