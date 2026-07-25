'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'

type Summary = {
  product_name: string
  current_stage: string
  target_qty: number | null
  cut_total: number
  cut_colors: { name: string; qty: number }[]
  print_out: number; print_in: number; print_vendor: string | null
  sew_out: number; sew_in: number; sew_vendor: string | null
  qc_out: number; qc_status: string | null
  dispatch_ready: number
  total_dispatched: number
}

const STAGE_CLS: Record<string, string> = {
  Cutting:    'bg-blue-100 text-blue-700',
  Printing:   'bg-teal-100 text-teal-700',
  Sewing:     'bg-orange-100 text-orange-700',
  QC:         'bg-green-100 text-green-700',
  Finishing:  'bg-purple-100 text-purple-700',
  Dispatched: 'bg-sky-100 text-sky-700',
  Completed:  'bg-slate-100 text-slate-600',
}

export default function ProductSummaryRow({
  productId,
  colSpan,
}: {
  productId: string
  colSpan: number
}) {
  const supabase = createClient()
  const [summary, setSummary] = useState<Summary | null>(null)

  useEffect(() => {
    const load = async () => {
      const [{ data: p }, { data: cut }, { data: print }, { data: sew }, { data: qc }, { data: fin }, { data: disp }] =
        await Promise.all([
          supabase.from('products').select('product_name,current_stage,target_qty').eq('id', productId).single(),
          supabase.from('cutting').select('total_qty,color_1_name,color_1_qty,color_2_name,color_2_qty,color_3_name,color_3_qty,color_4_name,color_4_qty,color_5_name,color_5_qty,color_6_name,color_6_qty').eq('product_id', productId).maybeSingle(),
          supabase.from('printing').select('out_qty,in_qty,vendor_name').eq('product_id', productId).maybeSingle(),
          supabase.from('sewing').select('out_qty,in_qty,vendor_name').eq('product_id', productId).maybeSingle(),
          supabase.from('qc').select('out_qty,status').eq('product_id', productId).maybeSingle(),
          supabase.from('finishing').select('dispatch_ready_qty').eq('product_id', productId).maybeSingle(),
          supabase.from('branch_dispatch').select('qty').eq('product_id', productId),
        ])

      if (!p) return

      const colors: { name: string; qty: number }[] = []
      if (cut) {
        for (let i = 1; i <= 6; i++) {
          const name = cut[`color_${i}_name` as keyof typeof cut] as string | null
          const qty  = cut[`color_${i}_qty`  as keyof typeof cut] as number ?? 0
          if (name && qty > 0) colors.push({ name, qty })
        }
      }

      setSummary({
        product_name:    p.product_name,
        current_stage:   p.current_stage,
        target_qty:      p.target_qty,
        cut_total:       cut?.total_qty ?? 0,
        cut_colors:      colors,
        print_out:       print?.out_qty ?? 0,
        print_in:        print?.in_qty  ?? 0,
        print_vendor:    print?.vendor_name ?? null,
        sew_out:         sew?.out_qty   ?? 0,
        sew_in:          sew?.in_qty    ?? 0,
        sew_vendor:      sew?.vendor_name ?? null,
        qc_out:          qc?.out_qty    ?? 0,
        qc_status:       qc?.status     ?? null,
        dispatch_ready:  fin?.dispatch_ready_qty ?? 0,
        total_dispatched:(disp ?? []).reduce((s, r) => s + (r.qty ?? 0), 0),
      })
    }
    load()
  }, [productId, supabase])

  if (!summary) return null

  const stageCls = STAGE_CLS[summary.current_stage] ?? 'bg-slate-100 text-slate-600'

  const Stat = ({ label, value, sub }: { label: string; value: string | number; sub?: string }) => (
    <div className="flex flex-col items-center px-3 py-1 border-r border-slate-200 last:border-r-0 min-w-[64px]">
      <span className="text-[10px] text-slate-400 whitespace-nowrap">{label}</span>
      <span className="text-xs font-semibold text-slate-700">{value || '—'}</span>
      {sub && <span className="text-[9px] text-slate-400">{sub}</span>}
    </div>
  )

  return (
    <tr className="bg-blue-50/60 border-t-0">
      <td colSpan={colSpan} className="px-3 py-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Name + stage */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Link
              href={`/dashboard/products/${productId}`}
              className="text-xs font-semibold text-blue-700 hover:underline flex items-center gap-0.5"
              target="_blank"
            >
              {summary.product_name}
              <ExternalLink className="h-2.5 w-2.5" />
            </Link>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${stageCls}`}>
              {summary.current_stage}
            </span>
            {summary.target_qty && (
              <span className="text-[10px] text-slate-400">Target: {summary.target_qty.toLocaleString()} pcs</span>
            )}
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-slate-200 shrink-0" />

          {/* Stage stats */}
          <div className="flex items-stretch rounded border border-slate-200 bg-white divide-x divide-slate-200 text-xs overflow-hidden">
            <Stat label="Cut"
              value={summary.cut_total}
              sub={summary.cut_colors.map(c => `${c.name} ${c.qty}`).join(' · ') || undefined}
            />
            <Stat label="Print out/in"
              value={`${summary.print_out} / ${summary.print_in}`}
              sub={summary.print_vendor ?? undefined}
            />
            <Stat label="Sewing out/in"
              value={`${summary.sew_out} / ${summary.sew_in}`}
              sub={summary.sew_vendor ?? undefined}
            />
            <Stat label="QC passed"
              value={summary.qc_out}
              sub={summary.qc_status ?? undefined}
            />
            <Stat label="Ready dispatch"  value={summary.dispatch_ready} />
            <Stat label="Dispatched"      value={summary.total_dispatched} />
          </div>
        </div>
      </td>
    </tr>
  )
}
