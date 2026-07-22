'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { refreshProductStage } from '@/lib/utils/stageAdvance'
import type { ProductStage } from '@/types/app'

type FinishingData = {
  product_id: string
  start_date: string | null
  completed_date: string | null
  received_qty: number
  ironing_qty: number
  folding_qty: number
  dispatch_ready_qty: number
  notes: string | null
}

const EMPTY = (productId: string): FinishingData => ({
  product_id: productId,
  start_date: null, completed_date: null,
  received_qty: 0, ironing_qty: 0, folding_qty: 0, dispatch_ready_qty: 0, notes: null,
})

function NumField({ label, value, onChange, onBlur, readOnly, syncedBadge }: {
  label: string; value: number
  onChange: (v: number) => void; onBlur: (v: number) => void
  readOnly?: boolean; syncedBadge?: boolean
}) {
  const [local, setLocal] = useState(value === 0 ? '' : String(value))
  useEffect(() => { setLocal(value === 0 ? '' : String(value)) }, [value])

  if (readOnly) {
    return (
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-slate-700 w-40">{label}</label>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-700 w-32 text-right">{value.toLocaleString()}</span>
          {syncedBadge && (
            <Badge variant="secondary" className="bg-teal-50 text-teal-600 text-[10px] font-normal">auto-synced</Badge>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <label className="text-sm font-medium text-slate-700 w-40">{label}</label>
      <input
        type="number" min={0} step={1} value={local} placeholder="0"
        className="border rounded px-3 py-2 text-sm w-32 text-right focus:outline-none focus:ring-1 focus:ring-blue-400"
        onChange={e => { setLocal(e.target.value); onChange(parseInt(e.target.value)||0) }}
        onFocus={e => e.target.select()}
        onBlur={e => onBlur(parseInt(e.target.value)||0)}
      />
      <span className="text-sm text-slate-400">pcs</span>
    </div>
  )
}

export default function FinishingTab({
  productId, onStageChange, hasLinkedEntries = false,
}: { productId: string; onStageChange: (s: ProductStage) => void; hasLinkedEntries?: boolean }) {
  const supabase = createClient()
  const [data, setData] = useState<FinishingData>(EMPTY(productId))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('finishing').select('*').eq('product_id', productId).maybeSingle()
      .then(({ data: row }) => {
        if (row) setData({ ...EMPTY(productId), ...row })
        setLoading(false)
      })
  }, [productId, supabase])

  const save = async (updated: FinishingData) => {
    const { error } = await supabase.from('finishing').upsert(
      { ...updated, product_id: productId },
      { onConflict: 'product_id' }
    )
    if (error) { toast.error('Save failed'); return }
    await refreshProductStage(supabase, productId, onStageChange)
  }

  if (loading) return <div className="p-4 space-y-3">{Array.from({length:4}).map((_,i)=><Skeleton key={i} className="h-10 w-64"/>)}</div>

  const flowPct = data.received_qty > 0
    ? Math.round((data.dispatch_ready_qty / data.received_qty) * 100)
    : 0

  return (
    <div className="p-5 space-y-5 max-w-sm">
      {hasLinkedEntries && (
        <div className="rounded-md bg-teal-50 border border-teal-200 px-3 py-2 text-xs text-teal-700">
          <strong>Received into Finishing</strong> is auto-synced from the Daily Entry Sheet.
        </div>
      )}
      <p className="text-xs text-slate-500">Track pieces through each finishing operation. Each field auto-saves on blur.</p>

      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-slate-700 w-32">Start Date</label>
          <input type="date"
            className="border rounded px-3 py-2 text-sm w-44 focus:outline-none focus:ring-1 focus:ring-blue-400"
            value={data.start_date ?? ''}
            onChange={e => setData(d => ({ ...d, start_date: e.target.value || null }))}
            onBlur={e => { const u = { ...data, start_date: e.target.value || null }; setData(u); save(u) }} />
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-slate-700 w-36">Completed Date</label>
          <input type="date"
            className="border rounded px-3 py-2 text-sm w-44 focus:outline-none focus:ring-1 focus:ring-blue-400"
            value={data.completed_date ?? ''}
            onChange={e => setData(d => ({ ...d, completed_date: e.target.value || null }))}
            onBlur={e => { const u = { ...data, completed_date: e.target.value || null }; setData(u); save(u) }} />
        </div>
      </div>

      <div className="space-y-3">
        <NumField
          label="Received into Finishing" value={data.received_qty}
          readOnly={hasLinkedEntries} syncedBadge={hasLinkedEntries}
          onChange={v => setData(d => ({ ...d, received_qty: v }))}
          onBlur={v => { const u = { ...data, received_qty: v }; setData(u); save(u) }}
        />
        <NumField label="After Ironing" value={data.ironing_qty}
          onChange={v => setData(d => ({ ...d, ironing_qty: v }))}
          onBlur={v => { const u = { ...data, ironing_qty: v }; setData(u); save(u) }}
        />
        <NumField label="After Folding" value={data.folding_qty}
          onChange={v => setData(d => ({ ...d, folding_qty: v }))}
          onBlur={v => { const u = { ...data, folding_qty: v }; setData(u); save(u) }}
        />
        <NumField label="Dispatch Ready" value={data.dispatch_ready_qty}
          onChange={v => setData(d => ({ ...d, dispatch_ready_qty: v }))}
          onBlur={v => { const u = { ...data, dispatch_ready_qty: v }; setData(u); save(u) }}
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">Notes</label>
        <textarea
          rows={2}
          value={data.notes ?? ''}
          placeholder="Any issues, delays, or remarks…"
          className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none"
          onChange={e => setData(d => ({ ...d, notes: e.target.value || null }))}
          onBlur={e => { const v = e.target.value || null; const u = { ...data, notes: v }; setData(u); save(u) }}
        />
      </div>

      {data.dispatch_ready_qty > 0 && (
        <div className="rounded-lg bg-purple-50 border border-purple-200 p-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-purple-700">Dispatch Ready</span>
            <span className="font-bold text-purple-800">{data.dispatch_ready_qty.toLocaleString()} pcs</span>
          </div>
          {data.received_qty > 0 && (
            <>
              <div className="h-1.5 bg-purple-200 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${Math.min(flowPct, 100)}%` }} />
              </div>
              <p className="text-xs text-purple-600">{flowPct}% of received through finishing</p>
            </>
          )}
        </div>
      )}
    </div>
  )
}
