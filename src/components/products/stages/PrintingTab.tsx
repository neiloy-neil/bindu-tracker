'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { PRINT_STATUS } from '@/constants'
import { refreshProductStage } from '@/lib/utils/stageAdvance'
import type { ProductStage, PrintStatus } from '@/types/app'
import VendorSelect from '@/components/vendors/VendorSelect'
import ColorQtyGrid from './ColorQtyGrid'

type PrintRow = {
  product_id: string
  vendor_name: string | null
  sending_date: string | null
  out_qty: number
  recv_date: string | null
  in_qty: number
  short_qty: number
  recv_color_1_qty: number; recv_color_2_qty: number; recv_color_3_qty: number
  recv_color_4_qty: number; recv_color_5_qty: number; recv_color_6_qty: number
  status: PrintStatus | null
  notes: string | null
}

const EMPTY = (productId: string): PrintRow => ({
  product_id: productId,
  vendor_name: null, sending_date: null, out_qty: 0,
  recv_date: null, in_qty: 0, short_qty: 0,
  recv_color_1_qty: 0, recv_color_2_qty: 0, recv_color_3_qty: 0,
  recv_color_4_qty: 0, recv_color_5_qty: 0, recv_color_6_qty: 0,
  status: null, notes: null,
})

type CuttingColors = Array<{ name: string | null }>

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

export default function PrintingTab({
  productId, onStageChange, hasLinkedEntries = false,
}: { productId: string; onStageChange: (s: ProductStage) => void; hasLinkedEntries?: boolean }) {
  const supabase = createClient()
  const [data, setData] = useState<PrintRow>(EMPTY(productId))
  const [cuttingColors, setCuttingColors] = useState<CuttingColors>(Array.from({ length: 6 }, () => ({ name: null })))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('printing').select('*').eq('product_id', productId).maybeSingle(),
      supabase.from('cutting').select('color_1_name,color_2_name,color_3_name,color_4_name,color_5_name,color_6_name').eq('product_id', productId).maybeSingle(),
    ]).then(([{ data: row }, { data: cut }]) => {
      if (row) setData(row as PrintRow)
      if (cut) setCuttingColors([1,2,3,4,5,6].map(n => ({ name: (cut as Record<string,string|null>)[`color_${n}_name`] })))
      setLoading(false)
    })
  }, [productId, supabase])

  const pending = (data.out_qty ?? 0) - (data.in_qty ?? 0)

  const save = async (updated: PrintRow) => {
    const { error } = await supabase.from('printing').upsert(
      { ...updated, product_id: productId },
      { onConflict: 'product_id' }
    )
    if (error) { toast.error('Save failed'); return }
    await refreshProductStage(supabase, productId, onStageChange)
  }

  const set = (field: keyof PrintRow, value: unknown) => {
    const updated = { ...data, [field]: value }
    setData(updated)
    save(updated)
  }

  const inputCls = 'border rounded px-2 py-1 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-400'

  if (loading) return <div className="space-y-3 p-4">{Array.from({length:5}).map((_,i)=><Skeleton key={i} className="h-8 w-full"/>)}</div>

  return (
    <div className="p-4 max-w-xl space-y-0">
      {hasLinkedEntries && (
        <div className="mb-3 rounded-md bg-teal-50 border border-teal-200 px-3 py-2 text-xs text-teal-700">
          Numbers marked <strong>auto-filled</strong> are calculated automatically from your Daily Entry Sheet records. You don&apos;t need to type them here.
        </div>
      )}

      <Field label="Vendor / Print House">
        <VendorSelect
          type="printing"
          value={data.vendor_name}
          onChange={v => set('vendor_name', v)}
        />
      </Field>

      <Field label="Status">
        <Select value={data.status ?? ''} onValueChange={v => set('status', v as PrintStatus || null)}>
          <SelectTrigger className="w-52 h-8 text-sm"><SelectValue placeholder="Select status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">— None —</SelectItem>
            {PRINT_STATUS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Sending Date">
        <input type="date" className={inputCls + ' w-44'} value={data.sending_date ?? ''}
          onChange={e => setData(d => ({ ...d, sending_date: e.target.value || null }))}
          onBlur={e => { const v = e.target.value || null; const u = { ...data, sending_date: v }; setData(u); save(u) }} />
      </Field>

      <Field label="Sent Out (QTY)">
        {hasLinkedEntries ? <SyncedQty value={data.out_qty} /> : (
          <input type="number" min={0} className={inputCls + ' w-28 text-right'} value={data.out_qty || ''}
            placeholder="0"
            onChange={e => setData(d => ({ ...d, out_qty: parseInt(e.target.value)||0 }))}
            onBlur={e => { const v = parseInt(e.target.value)||0; const u = { ...data, out_qty: v }; setData(u); save(u) }} />
        )}
      </Field>

      <Field label="Received Date">
        <input type="date" className={inputCls + ' w-44'} value={data.recv_date ?? ''}
          onChange={e => setData(d => ({ ...d, recv_date: e.target.value || null }))}
          onBlur={e => { const v = e.target.value || null; const u = { ...data, recv_date: v }; setData(u); save(u) }} />
      </Field>

      <Field label="Received Back (QTY)">
        {hasLinkedEntries ? <SyncedQty value={data.in_qty} /> : (
          <input type="number" min={0} className={inputCls + ' w-28 text-right'} value={data.in_qty || ''}
            placeholder="0"
            onChange={e => setData(d => ({ ...d, in_qty: parseInt(e.target.value)||0 }))}
            onBlur={e => { const v = parseInt(e.target.value)||0; const u = { ...data, in_qty: v }; setData(u); save(u) }} />
        )}
      </Field>

      <Field label="Short (QTY)">
        <input type="number" min={0} className={inputCls + ' w-28 text-right'} value={data.short_qty || ''}
          placeholder="0"
          onChange={e => setData(d => ({ ...d, short_qty: parseInt(e.target.value)||0 }))}
          onBlur={e => { const v = parseInt(e.target.value)||0; const u = { ...data, short_qty: v }; setData(u); save(u) }} />
      </Field>

      <div className="py-2">
        <ColorQtyGrid
          label="Received by Color"
          colors={cuttingColors}
          values={[1,2,3,4,5,6].map(n => data[`recv_color_${n}_qty` as keyof PrintRow] as number)}
          readOnly={hasLinkedEntries}
          onChange={(i, qty) => {
            const field = `recv_color_${i + 1}_qty` as keyof PrintRow
            const u = { ...data, [field]: qty }
            setData(u); save(u)
          }}
        />
      </div>

      <Field label="Still at Vendor">
        <Badge variant="secondary" className={pending > 0 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}>
          {pending} pcs
        </Badge>
      </Field>

      <Field label="Notes">
        <textarea className={inputCls + ' resize-none'} rows={2} value={data.notes ?? ''} placeholder="Any notes…"
          onChange={e => setData(d => ({ ...d, notes: e.target.value }))}
          onBlur={e => { const v = e.target.value || null; const u = { ...data, notes: v }; setData(u); save(u) }} />
      </Field>
    </div>
  )
}
