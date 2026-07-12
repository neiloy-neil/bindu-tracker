'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { SEW_STATUS } from '@/constants'
import { refreshProductStage } from '@/lib/utils/stageAdvance'
import type { ProductStage, SewStatus } from '@/types/app'
import VendorSelect from '@/components/vendors/VendorSelect'

type SewRow = {
  product_id: string
  vendor_name: string | null
  out_qty: number
  in_qty: number
  status: SewStatus | null
}

const EMPTY = (productId: string): SewRow => ({
  product_id: productId, vendor_name: null, out_qty: 0, in_qty: 0, status: null,
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

export default function SewingTab({
  productId, onStageChange, hasLinkedEntries = false,
}: { productId: string; onStageChange: (s: ProductStage) => void; hasLinkedEntries?: boolean }) {
  const supabase = createClient()
  const [data, setData] = useState<SewRow>(EMPTY(productId))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('sewing').select('*').eq('product_id', productId).maybeSingle()
      .then(({ data: row }) => {
        if (row) setData(row as SewRow)
        setLoading(false)
      })
  }, [productId, supabase])

  const pending = (data.out_qty ?? 0) - (data.in_qty ?? 0)

  const save = async (updated: SewRow) => {
    const { error } = await supabase.from('sewing').upsert(
      { ...updated, product_id: productId },
      { onConflict: 'product_id' }
    )
    if (error) { toast.error('Save failed'); return }
    await refreshProductStage(supabase, productId, onStageChange)
  }

  const set = (field: keyof SewRow, value: unknown) => {
    const updated = { ...data, [field]: value }
    setData(updated)
    save(updated)
  }

  const inputCls = 'border rounded px-2 py-1 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-400'

  if (loading) return <div className="space-y-3 p-4">{Array.from({length:4}).map((_,i)=><Skeleton key={i} className="h-8 w-full"/>)}</div>

  return (
    <div className="p-4 max-w-xl space-y-0">
      {hasLinkedEntries && (
        <div className="mb-3 rounded-md bg-teal-50 border border-teal-200 px-3 py-2 text-xs text-teal-700">
          Quantities marked <strong>auto-synced</strong> are computed from the Daily Entry Sheet and cannot be edited here.
        </div>
      )}

      <Field label="Sewing Vendor">
        <VendorSelect
          type="sewing"
          value={data.vendor_name}
          onChange={v => set('vendor_name', v)}
        />
      </Field>

      <Field label="Status">
        <Select value={data.status ?? ''} onValueChange={v => set('status', v as SewStatus || null)}>
          <SelectTrigger className="w-40 h-8 text-sm"><SelectValue placeholder="Select status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">— None —</SelectItem>
            {SEW_STATUS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Sent Out (QTY)">
        {hasLinkedEntries ? <SyncedQty value={data.out_qty} /> : (
          <input type="number" min={0} className={inputCls + ' w-28 text-right'} value={data.out_qty || ''}
            placeholder="0"
            onChange={e => setData(d => ({ ...d, out_qty: parseInt(e.target.value)||0 }))}
            onBlur={e => { const v = parseInt(e.target.value)||0; const u = { ...data, out_qty: v }; setData(u); save(u) }} />
        )}
      </Field>

      <Field label="Received Back (QTY)">
        {hasLinkedEntries ? <SyncedQty value={data.in_qty} /> : (
          <input type="number" min={0} className={inputCls + ' w-28 text-right'} value={data.in_qty || ''}
            placeholder="0"
            onChange={e => setData(d => ({ ...d, in_qty: parseInt(e.target.value)||0 }))}
            onBlur={e => { const v = parseInt(e.target.value)||0; const u = { ...data, in_qty: v }; setData(u); save(u) }} />
        )}
      </Field>

      <Field label="Still at Sewing">
        <Badge variant="secondary" className={pending > 0 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}>
          {pending} pcs
        </Badge>
      </Field>
    </div>
  )
}
