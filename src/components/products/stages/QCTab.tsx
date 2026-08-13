'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { QC_STATUS } from '@/constants'
import { refreshProductStage } from '@/lib/utils/stageAdvance'
import { logActivity } from '@/lib/utils/logActivity'
import type { ProductStage, QcStatus } from '@/types/app'

type QCRow = {
  product_id: string
  start_date: string | null
  in_qty: number
  out_qty: number
  reject_qty: number
  alter_qty: number
  spot_qty: number
  status: QcStatus | null
}

const EMPTY = (productId: string): QCRow => ({
  product_id: productId, start_date: null, in_qty: 0, out_qty: 0,
  reject_qty: 0, alter_qty: 0, spot_qty: 0, status: null,
})

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[160px_1fr] items-center gap-3 py-2 border-b border-slate-100 last:border-0">
      <label className="text-sm text-slate-500">{label}</label>
      <div>{children}</div>
    </div>
  )
}



export default function QCTab({
  productId, productCode, productName, onStageChange
}: { productId: string; productCode: string; productName: string; onStageChange: (s: ProductStage) => void }) {
  const supabase = createClient()
  const [data, setData] = useState<QCRow>(EMPTY(productId))
  const [loading, setLoading] = useState(true)
  const logTimer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    supabase.from('qc').select('*').eq('product_id', productId).maybeSingle()
      .then(({ data: row }) => {
        if (row) setData(row as QCRow)
        setLoading(false)
      })
  }, [productId, supabase])

  const rejectRate = data.in_qty > 0
    ? ((data.reject_qty / data.in_qty) * 100).toFixed(1)
    : '0.0'

  const save = async (updated: QCRow) => {
    const { error } = await supabase.from('qc').upsert(
      { ...updated, product_id: productId },
      { onConflict: 'product_id' }
    )
    if (error) { toast.error('Save failed'); return }
    await refreshProductStage(supabase, productId, onStageChange)
    clearTimeout(logTimer.current)
    logTimer.current = setTimeout(() => {
      const parts = [
        updated.out_qty ? `Passed: ${updated.out_qty}` : null,
        updated.reject_qty ? `Rejected: ${updated.reject_qty}` : null,
        updated.alter_qty ? `Alter: ${updated.alter_qty}` : null,
        updated.spot_qty ? `Spot: ${updated.spot_qty}` : null,
      ].filter(Boolean).join(' · ')
      logActivity(supabase, productId, productCode, productName, 'QC', parts || undefined)
    }, 1500)
  }

  const set = (field: keyof QCRow, value: unknown) => {
    const updated = { ...data, [field]: value }
    setData(updated)
    save(updated)
  }

  const numInput = (field: keyof QCRow) => (
    <input type="number" min={0}
      className="border rounded px-2 py-1 text-sm w-28 text-right focus:outline-none focus:ring-1 focus:ring-blue-400"
      value={(data[field] as number) || ''}
      placeholder="0"
      onChange={e => setData(d => ({ ...d, [field]: parseInt(e.target.value)||0 }))}
      onBlur={e => { const v = parseInt(e.target.value)||0; const u = { ...data, [field]: v }; setData(u); save(u) }}
    />
  )

  if (loading) return <div className="space-y-3 p-4">{Array.from({length:5}).map((_,i)=><Skeleton key={i} className="h-8 w-full"/>)}</div>

  return (
    <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      {/* Left — form fields */}
      <div className="space-y-0">


        <Field label="Start Date">
          <input type="date"
            className="border rounded px-2 py-1 text-sm w-44 focus:outline-none focus:ring-1 focus:ring-blue-400"
            value={data.start_date ?? ''}
            onChange={e => setData(d => ({ ...d, start_date: e.target.value || null }))}
            onBlur={e => { const v = e.target.value || null; const u = { ...data, start_date: v }; setData(u); save(u) }} />
        </Field>

        <Field label="Status">
          <Select value={data.status ?? ''} onValueChange={v => set('status', v as QcStatus || null)}>
            <SelectTrigger className="w-36 h-8 text-sm"><SelectValue placeholder="Select status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">— None —</SelectItem>
              {QC_STATUS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>

        <Field label="QC Received">
          {numInput('in_qty')}
        </Field>

        <Field label="QC Output (Pass)">
          {numInput('out_qty')}
        </Field>

        <Field label="Reject">
          <div className="flex items-center gap-2">
            {numInput('reject_qty')}
            <span className="text-xs text-red-500 font-medium">{rejectRate}% reject rate</span>
          </div>
        </Field>

        <Field label="Alter">
          {numInput('alter_qty')}
        </Field>

        <Field label="Spot">
          {numInput('spot_qty')}
        </Field>
      </div>

      {/* Right — defect summary */}
      <div className="space-y-3">
        {(data.reject_qty + data.alter_qty + data.spot_qty) > 0 ? (
          <div className="rounded-lg border border-red-100 bg-red-50 p-5 space-y-3">
            <p className="text-xs font-semibold text-red-500 uppercase tracking-wide">Defect Summary</p>
            <div className="space-y-2">
              {data.reject_qty > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Rejected</span>
                  <span className="font-semibold text-red-700">{data.reject_qty.toLocaleString()} pcs</span>
                </div>
              )}
              {data.alter_qty > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Altered</span>
                  <span className="font-semibold text-red-600">{data.alter_qty.toLocaleString()} pcs</span>
                </div>
              )}
              {data.spot_qty > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Spot</span>
                  <span className="font-semibold text-orange-600">{data.spot_qty.toLocaleString()} pcs</span>
                </div>
              )}
              <div className="border-t border-red-200 pt-3 flex justify-between text-sm font-bold">
                <span className="text-red-700">Total Issues</span>
                <span className="text-red-700">{(data.reject_qty + data.alter_qty + data.spot_qty).toLocaleString()} pcs</span>
              </div>
            </div>
            {rejectRate !== '0.0' && (
              <p className="text-xs text-red-500">{rejectRate}% reject rate</p>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-green-100 bg-green-50 p-5">
            <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1">Defect Summary</p>
            <p className="text-sm text-green-700">No defects recorded</p>
          </div>
        )}
        {data.out_qty > 0 && (
          <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 flex justify-between text-sm">
            <span className="text-slate-500">QC Pass rate</span>
            <span className="font-semibold text-green-700">
              {data.in_qty > 0 ? Math.round((data.out_qty / data.in_qty) * 100) : 100}%
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
