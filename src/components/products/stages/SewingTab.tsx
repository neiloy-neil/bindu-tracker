'use client'
import { useState, useEffect, useRef } from 'react'
import { format, parseISO } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Trash2, ChevronDown, ChevronUp, Plus } from 'lucide-react'
import { SEW_STATUS } from '@/constants'
import { refreshProductStage } from '@/lib/utils/stageAdvance'
import { logActivity } from '@/lib/utils/logActivity'
import type { ProductStage, SewStatus } from '@/types/app'
import VendorSelect from '@/components/vendors/VendorSelect'

type SewRow = {
  product_id: string
  vendor_name: string | null
  sending_date: string | null
  out_qty: number
  short_qty: number
  status: SewStatus | null
}

type Receipt = {
  id: string
  product_id: string
  receipt_date: string | null
  qty: number
  color_1_qty: number
  color_2_qty: number
  color_3_qty: number
  color_4_qty: number
  color_5_qty: number
  color_6_qty: number
  notes: string | null
  created_at: string
}

type CuttingColors = Array<{ name: string | null }>

const EMPTY = (productId: string): SewRow => ({
  product_id: productId, vendor_name: null, sending_date: null,
  out_qty: 0, short_qty: 0, status: null,
})

const EMPTY_RECEIPT = {
  receipt_date: '', qty: 0,
  color_1_qty: 0, color_2_qty: 0, color_3_qty: 0,
  color_4_qty: 0, color_5_qty: 0, color_6_qty: 0,
  notes: '',
}

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

function ReceiptColorBreakdown({ receipt, colors }: { receipt: Receipt; colors: CuttingColors }) {
  const colorQtys = [1, 2, 3, 4, 5, 6].map(n => ({
    name: colors[n - 1]?.name,
    qty: receipt[`color_${n}_qty` as keyof Receipt] as number,
  })).filter(c => c.qty > 0)
  if (colorQtys.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2 mt-1.5 pl-2">
      {colorQtys.map((c, i) => (
        <span key={i} className="text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
          {c.name ?? `Color ${i + 1}`}: {c.qty}
        </span>
      ))}
    </div>
  )
}

export default function SewingTab({
  productId, productCode, productName, onStageChange, hasLinkedEntries = false,
}: { productId: string; productCode: string; productName: string; onStageChange: (s: ProductStage) => void; hasLinkedEntries?: boolean }) {
  const supabase = createClient()
  const [data, setData] = useState<SewRow>(EMPTY(productId))
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [cuttingColors, setCuttingColors] = useState<CuttingColors>(Array.from({ length: 6 }, () => ({ name: null })))
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newReceipt, setNewReceipt] = useState({ ...EMPTY_RECEIPT })
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const logTimer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    Promise.all([
      supabase.from('sewing')
        .select('product_id,vendor_name,sending_date,out_qty,short_qty,status')
        .eq('product_id', productId).maybeSingle(),
      supabase.from('sewing_receipts')
        .select('*')
        .eq('product_id', productId)
        .order('receipt_date', { ascending: true }),
      supabase.from('cutting')
        .select('color_1_name,color_2_name,color_3_name,color_4_name,color_5_name,color_6_name')
        .eq('product_id', productId).maybeSingle(),
    ]).then(([{ data: row }, { data: recs }, { data: cut }]) => {
      if (row) setData(row as SewRow)
      if (recs) setReceipts(recs as Receipt[])
      if (cut) setCuttingColors([1, 2, 3, 4, 5, 6].map(n => ({ name: (cut as Record<string, string | null>)[`color_${n}_name`] })))
      setLoading(false)
    })
  }, [productId, supabase])

  const totalReceived = receipts.reduce((sum, r) => sum + r.qty, 0)
  const pending = (data.out_qty ?? 0) - totalReceived

  const saveParent = async (updated: SewRow) => {
    const { error } = await supabase.from('sewing').upsert({
      product_id: productId,
      vendor_name: updated.vendor_name,
      sending_date: updated.sending_date,
      out_qty: updated.out_qty,
      short_qty: updated.short_qty,
      status: updated.status,
    }, { onConflict: 'product_id' })
    if (error) { toast.error('Save failed'); return }
    await refreshProductStage(supabase, productId, onStageChange)
    clearTimeout(logTimer.current)
    logTimer.current = setTimeout(() => {
      const parts = [
        updated.vendor_name ? `Vendor: ${updated.vendor_name}` : null,
        updated.out_qty ? `Sent: ${updated.out_qty}` : null,
      ].filter(Boolean).join(' · ')
      logActivity(supabase, productId, productCode, productName, 'Sewing', parts || undefined)
    }, 1500)
  }

  const set = (field: keyof SewRow, value: unknown) => {
    const updated = { ...data, [field]: value }
    setData(updated)
    saveParent(updated)
  }

  const addReceipt = async () => {
    if (!newReceipt.qty) { toast.error('Quantity is required'); return }
    const { data: inserted, error } = await supabase.from('sewing_receipts').insert({
      product_id: productId,
      receipt_date: newReceipt.receipt_date || null,
      qty: newReceipt.qty,
      color_1_qty: newReceipt.color_1_qty,
      color_2_qty: newReceipt.color_2_qty,
      color_3_qty: newReceipt.color_3_qty,
      color_4_qty: newReceipt.color_4_qty,
      color_5_qty: newReceipt.color_5_qty,
      color_6_qty: newReceipt.color_6_qty,
      notes: newReceipt.notes || null,
    }).select().single()
    if (error) { toast.error('Failed to add batch'); return }
    setReceipts(prev => [...prev, inserted as Receipt].sort((a, b) =>
      (a.receipt_date ?? '') < (b.receipt_date ?? '') ? -1 : 1
    ))
    setNewReceipt({ ...EMPTY_RECEIPT })
    setShowAddForm(false)
    const dateStr = newReceipt.receipt_date
      ? format(parseISO(newReceipt.receipt_date), 'dd MMM yyyy')
      : 'no date'
    logActivity(supabase, productId, productCode, productName, 'Sewing',
      `Batch received: ${newReceipt.qty} pcs on ${dateStr}`)
  }

  const deleteReceipt = async (id: string) => {
    const { error } = await supabase.from('sewing_receipts').delete().eq('id', id)
    if (error) { toast.error('Delete failed'); return }
    setReceipts(prev => prev.filter(r => r.id !== id))
    if (expandedId === id) setExpandedId(null)
  }

  const inputCls = 'border rounded px-2 py-1 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-400'

  if (loading) return <div className="space-y-3 p-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>

  const hasColorNames = cuttingColors.some(c => c.name)

  return (
    <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      {/* Left — vendor, status, dates, quantities */}
      <div className="space-y-0">
        {hasLinkedEntries && (
          <div className="mb-3 rounded-md bg-teal-50 border border-teal-200 px-3 py-2 text-xs text-teal-700">
            Numbers marked <strong>auto-synced</strong> are calculated automatically from your Daily Entry Sheet records. You don&apos;t need to type them here.
          </div>
        )}

        <Field label="Sewing Vendor">
          <VendorSelect type="sewing" value={data.vendor_name} onChange={v => set('vendor_name', v)} />
        </Field>

        <Field label="Sending Date">
          <input type="date" className={inputCls + ' w-44'} value={data.sending_date ?? ''}
            onChange={e => setData(d => ({ ...d, sending_date: e.target.value || null }))}
            onBlur={e => { const v = e.target.value || null; const u = { ...data, sending_date: v }; setData(u); saveParent(u) }} />
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
              onChange={e => setData(d => ({ ...d, out_qty: parseInt(e.target.value) || 0 }))}
              onBlur={e => { const v = parseInt(e.target.value) || 0; const u = { ...data, out_qty: v }; setData(u); saveParent(u) }} />
          )}
        </Field>

        <Field label="Short (QTY)">
          <input type="number" min={0} className={inputCls + ' w-28 text-right'} value={data.short_qty || ''}
            placeholder="0"
            onChange={e => setData(d => ({ ...d, short_qty: parseInt(e.target.value) || 0 }))}
            onBlur={e => { const v = parseInt(e.target.value) || 0; const u = { ...data, short_qty: v }; setData(u); saveParent(u) }} />
        </Field>

        <Field label="Still at Sewing">
          <Badge variant="secondary" className={pending > 0 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}>
            {pending} pcs
          </Badge>
        </Field>
      </div>

      {/* Right — received batches */}
      <div className="pt-1">
      {/* ── Received Batches ─────────────────────────────────────── */}
      <div className="pb-2">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-slate-700">Received Batches</h4>
          <span className="text-xs text-slate-400">
            Total received: <span className="font-medium text-slate-600">{totalReceived.toLocaleString()} pcs</span>
          </span>
        </div>

        {receipts.length === 0 && !showAddForm && (
          <p className="text-xs text-slate-400 italic mb-3">No batches recorded yet.</p>
        )}

        <div className="space-y-1 mb-3">
          {receipts.map(r => {
            const isExpanded = expandedId === r.id
            const dateLabel = r.receipt_date
              ? format(parseISO(r.receipt_date), 'dd MMM yyyy')
              : <span className="text-slate-400 italic">No date</span>
            return (
              <div key={r.id} className="rounded-md border border-slate-200 bg-white">
                <div className="flex items-center gap-3 px-3 py-2">
                  <span className="text-sm text-slate-600 w-28 shrink-0">{dateLabel}</span>
                  <span className="text-sm font-semibold text-slate-800">{r.qty.toLocaleString()} pcs</span>
                  {r.notes && <span className="text-xs text-slate-400 flex-1 truncate">{r.notes}</span>}
                  <div className="ml-auto flex items-center gap-1">
                    {hasColorNames && (
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : r.id)}
                        className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                        title="Color breakdown"
                      >
                        {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </button>
                    )}
                    <button
                      onClick={() => deleteReceipt(r.id)}
                      className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                      title="Delete batch"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                {isExpanded && (
                  <div className="px-3 pb-2 border-t border-slate-100">
                    <ReceiptColorBreakdown receipt={r} colors={cuttingColors} />
                    {!hasColorNames && <p className="text-xs text-slate-400 italic mt-1">No color names set in Cutting tab.</p>}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {showAddForm ? (
          <div className="rounded-md border border-orange-200 bg-orange-50 p-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Receipt Date</label>
                <input type="date" className={inputCls}
                  value={newReceipt.receipt_date}
                  onChange={e => setNewReceipt(r => ({ ...r, receipt_date: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Qty Received <span className="text-red-400">*</span></label>
                <input type="number" min={0} className={inputCls + ' text-right'}
                  placeholder="0"
                  value={newReceipt.qty || ''}
                  onChange={e => setNewReceipt(r => ({ ...r, qty: parseInt(e.target.value) || 0 }))} />
              </div>
            </div>

            {hasColorNames && (
              <div>
                <label className="text-xs text-slate-500 mb-1.5 block">Color Breakdown (optional)</label>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6].map(n => {
                    const name = cuttingColors[n - 1]?.name
                    if (!name) return null
                    const field = `color_${n}_qty` as keyof typeof newReceipt
                    return (
                      <div key={n}>
                        <label className="text-[11px] text-slate-500 mb-0.5 block truncate">{name}</label>
                        <input type="number" min={0} className={inputCls + ' text-right'}
                          placeholder="0"
                          value={(newReceipt[field] as number) || ''}
                          onChange={e => setNewReceipt(r => ({ ...r, [field]: parseInt(e.target.value) || 0 }))} />
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div>
              <label className="text-xs text-slate-500 mb-1 block">Notes (optional)</label>
              <input type="text" className={inputCls}
                placeholder="e.g. 1st shipment, partial"
                value={newReceipt.notes}
                onChange={e => setNewReceipt(r => ({ ...r, notes: e.target.value }))} />
            </div>

            <div className="flex gap-2">
              <Button size="sm" onClick={addReceipt} className="bg-orange-600 hover:bg-orange-700 text-white h-8">
                Save Batch
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setShowAddForm(false); setNewReceipt({ ...EMPTY_RECEIPT }) }} className="h-8">
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1.5 text-sm text-orange-600 hover:text-orange-800 font-medium transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Batch
          </button>
        )}
      </div>
      </div>
    </div>
  )
}
