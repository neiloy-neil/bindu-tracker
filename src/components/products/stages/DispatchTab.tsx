'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { BRANCHES } from '@/constants'

type Slot = { dispatch_date: string | null; qty: number }
type DispatchMap = Record<string, [Slot, Slot, Slot]>

const EMPTY_SLOT: Slot = { dispatch_date: null, qty: 0 }
const emptyMap = (): DispatchMap =>
  Object.fromEntries(BRANCHES.map(b => [b, [{ ...EMPTY_SLOT }, { ...EMPTY_SLOT }, { ...EMPTY_SLOT }]]))

export default function DispatchTab({
  productId,
  onTotalChange,
}: {
  productId: string
  onTotalChange?: (total: number) => void
}) {
  const supabase = createClient()
  const [map, setMap] = useState<DispatchMap>(emptyMap)
  const [loading, setLoading] = useState(true)
  const [dispatchReady, setDispatchReady] = useState<number | null>(null)

  useEffect(() => {
    supabase.from('finishing').select('dispatch_ready_qty').eq('product_id', productId).maybeSingle()
      .then(({ data }) => { if (data) setDispatchReady(data.dispatch_ready_qty) })
  }, [productId, supabase])

  useEffect(() => {
    supabase.from('branch_dispatch').select('*').eq('product_id', productId)
      .then(({ data, error }) => {
        if (error) { toast.error('Failed to load dispatch data'); setLoading(false); return }
        const m = emptyMap()
        for (const row of data ?? []) {
          const idx = (row.dispatch_no as 1 | 2 | 3) - 1
          m[row.branch_name][idx] = { dispatch_date: row.dispatch_date, qty: row.qty }
        }
        setMap(m)
        const total = (data ?? []).reduce((s, r) => s + (r.qty ?? 0), 0)
        onTotalChange?.(total)
        setLoading(false)
      })
  }, [productId, supabase]) // eslint-disable-line react-hooks/exhaustive-deps

  const saveSlot = useCallback(async (branch: string, slotIdx: number, slot: Slot) => {
    const { error } = await supabase.from('branch_dispatch').upsert(
      {
        product_id: productId,
        branch_name: branch,
        dispatch_no: slotIdx + 1,
        dispatch_date: slot.dispatch_date || null,
        qty: slot.qty,
      },
      { onConflict: 'product_id,branch_name,dispatch_no' }
    )
    if (error) toast.error('Save failed')
  }, [productId, supabase])

  const updateSlot = (branch: string, slotIdx: number, field: keyof Slot, value: unknown) => {
    setMap(prev => {
      const m = { ...prev }
      const slots = [...m[branch]] as [Slot, Slot, Slot]
      slots[slotIdx] = { ...slots[slotIdx], [field]: value }
      m[branch] = slots
      saveSlot(branch, slotIdx, slots[slotIdx])
      const total = BRANCHES.reduce((s, b) => {
        const branchSlots = b === branch ? slots : m[b]
        return s + branchSlots.reduce((ss, sl) => ss + (sl.qty ?? 0), 0)
      }, 0)
      onTotalChange?.(total)
      return m
    })
  }

  const branchTotal = (branch: string) =>
    map[branch].reduce((s, sl) => s + (sl.qty ?? 0), 0)

  const grandTotal = BRANCHES.reduce((s, b) => s + branchTotal(b), 0)

  const inputCls = 'border rounded px-1 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400'
  const readonlyCls = 'border rounded px-1 py-0.5 text-xs bg-slate-50 text-slate-500 cursor-not-allowed border-dashed'

  if (loading) return (
    <div className="p-4 space-y-2">
      {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
    </div>
  )

  return (
    <div className="p-4 overflow-x-auto">
      <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1">
          <span className="border border-dashed border-slate-300 rounded px-2 py-0.5 bg-slate-50">Auto</span>
          Dispatch 1 is auto-synced from the Daily Entry Sheet. Edit dispatches 2 &amp; 3 manually.
        </span>
        {dispatchReady !== null && dispatchReady > 0 && (
          <span className="ml-auto inline-flex items-center gap-1 rounded bg-purple-50 border border-purple-200 px-2 py-0.5 text-purple-700 font-medium">
            {dispatchReady.toLocaleString()} pcs dispatch-ready (from Finishing)
          </span>
        )}
      </div>

      <table className="text-xs border-collapse w-full min-w-max">
        <thead>
          <tr className="bg-slate-100">
            <th className="text-left px-3 py-2 font-semibold text-slate-600 w-28">Branch</th>
            <th colSpan={2} className="text-center px-2 py-2 font-semibold text-slate-400 border-l border-slate-200 bg-slate-50">
              Dispatch 1
              <span className="ml-1 text-[10px] font-normal border border-dashed border-slate-300 rounded px-1">Auto</span>
            </th>
            {[2, 3].map(n => (
              <th key={n} colSpan={2} className="text-center px-2 py-2 font-semibold text-slate-600 border-l border-slate-200">
                Dispatch {n}
              </th>
            ))}
            <th className="text-right px-3 py-2 font-semibold text-slate-600 border-l border-slate-200">Total</th>
          </tr>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th></th>
            <th className="px-2 py-1 text-slate-400 font-normal border-l border-slate-200 min-w-[120px]">Date</th>
            <th className="px-2 py-1 text-slate-400 font-normal min-w-[64px]">QTY</th>
            {[1, 2].map(n => (
              <React.Fragment key={n}>
                <th className="px-2 py-1 text-slate-400 font-normal border-l border-slate-200 min-w-[120px]">Date</th>
                <th className="px-2 py-1 text-slate-400 font-normal min-w-[64px]">QTY</th>
              </React.Fragment>
            ))}
            <th></th>
          </tr>
        </thead>
        <tbody>
          {BRANCHES.map((branch, bi) => (
            <tr key={branch} className={bi % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
              <td className="px-3 py-1.5 font-medium text-slate-700">{branch}</td>

              {/* Slot 0 (dispatch_no=1) — auto-synced, read-only */}
              <td className="px-1 py-1 border-l border-slate-100">
                <input
                  type="date"
                  readOnly
                  className={readonlyCls + ' w-28'}
                  value={map[branch][0].dispatch_date ?? ''}
                  title="Auto-synced from Daily Entry Sheet"
                />
              </td>
              <td className="px-1 py-1">
                <input
                  type="number"
                  readOnly
                  className={readonlyCls + ' w-16 text-right'}
                  value={map[branch][0].qty || ''}
                  placeholder="0"
                  title="Auto-synced from Daily Entry Sheet"
                />
              </td>

              {/* Slots 1 & 2 (dispatch_no=2,3) — manual */}
              {([1, 2] as const).map(si => (
                <React.Fragment key={si}>
                  <td className="px-1 py-1 border-l border-slate-100">
                    <input
                      type="date"
                      className={inputCls + ' w-28'}
                      value={map[branch][si].dispatch_date ?? ''}
                      onChange={e => updateSlot(branch, si, 'dispatch_date', e.target.value || null)}
                    />
                  </td>
                  <td className="px-1 py-1">
                    <input
                      type="number" min={0}
                      className={inputCls + ' w-16 text-right'}
                      value={map[branch][si].qty || ''}
                      placeholder="0"
                      onChange={e => updateSlot(branch, si, 'qty', parseInt(e.target.value) || 0)}
                    />
                  </td>
                </React.Fragment>
              ))}

              <td className="px-3 py-1.5 text-right font-semibold border-l border-slate-200 text-slate-700">
                {branchTotal(branch) > 0 ? branchTotal(branch).toLocaleString() : '—'}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-slate-700 text-white font-semibold">
            <td className="px-3 py-2">Grand Total</td>
            <td colSpan={6}></td>
            <td className="px-3 py-2 text-right text-base">{grandTotal.toLocaleString()}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
