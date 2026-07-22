'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { QC_STATUS } from '@/constants'
import { refreshProductStage } from '@/lib/utils/stageAdvance'
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

function SyncedQty({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-slate-700 w-28 text-right">{value.toLocaleString()}</span>
      <Badge variant="secondary" className="bg-teal-50 text-teal-600 text-[10px] font-normal">auto-synced</Badge>
    </div>
  )
}

export default function QCTab({
  productId, onStageChange, hasLinkedEntries = false,
}: { productId: string; onStageChange: (s: ProductStage) => void; hasLinkedEntries?: boolean }) {
  const supabase = createClient()
  const [data, setData] = useState<QCRow>(EMPTY(productId))
  const [loading, setLoading] = useState(true)

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
    <div className="p-4 max-w-xl space-y-0">
      {hasLinkedEntries && (
        <div className="mb-3 rounded-md bg-teal-50 border border-teal-200 px-3 py-2 text-xs text-teal-700">
          Quantities marked <strong>auto-synced</strong> are computed from the Daily Entry Sheet and cannot be edited here.
        </div>
      )}

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
        {hasLinkedEntries ? <SyncedQty value={data.in_qty} /> : numInput('in_qty')}
      </Field>

      <Field label="QC Output (Pass)">
        {hasLinkedEntries ? <SyncedQty value={data.out_qty} /> : numInput('out_qty')}
      </Field>

      <Field label="Reject">
        <div className="flex items-center gap-2">
          {hasLinkedEntries ? <SyncedQty value={data.reject_qty} /> : numInput('reject_qty')}
          <span className="text-xs text-red-500 font-medium">{rejectRate}% reject rate</span>
        </div>
      </Field>

      <Field label="Alter">
        {hasLinkedEntries ? <SyncedQty value={data.alter_qty} /> : numInput('alter_qty')}
      </Field>

      <Field label="Spot">
        {hasLinkedEntries ? <SyncedQty value={data.spot_qty} /> : numInput('spot_qty')}
      </Field>

      <Field label="Issues Total">
        <Badge variant="secondary" className="bg-red-50 text-red-700">
          {data.reject_qty + data.alter_qty + data.spot_qty} pcs
        </Badge>
      </Field>
    </div>
  )
}
