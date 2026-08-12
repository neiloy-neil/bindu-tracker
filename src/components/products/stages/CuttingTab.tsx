'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { COLOR_OPTIONS } from '@/constants'
import { refreshProductStage } from '@/lib/utils/stageAdvance'
import { logActivity } from '@/lib/utils/logActivity'
import type { ProductStage } from '@/types/app'

type CuttingRow = {
  id?: string
  product_id: string
  start_date: string | null
  color_1_name: string | null; color_1_qty: number
  color_2_name: string | null; color_2_qty: number
  color_3_name: string | null; color_3_qty: number
  color_4_name: string | null; color_4_qty: number
  color_5_name: string | null; color_5_qty: number
  color_6_name: string | null; color_6_qty: number
  total_kg: number | null
}

const EMPTY = (productId: string): CuttingRow => ({
  product_id: productId,
  start_date: null,
  color_1_name: null, color_1_qty: 0,
  color_2_name: null, color_2_qty: 0,
  color_3_name: null, color_3_qty: 0,
  color_4_name: null, color_4_qty: 0,
  color_5_name: null, color_5_qty: 0,
  color_6_name: null, color_6_qty: 0,
  total_kg: null,
})

const COLORS = [1,2,3,4,5,6] as const

function NumInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [local, setLocal] = useState(value === 0 ? '' : String(value))
  useEffect(() => { setLocal(value === 0 ? '' : String(value)) }, [value])
  return (
    <input
      type="number" min={0} step={1}
      value={local} placeholder="0"
      className="w-20 border rounded px-2 py-1 text-sm text-right focus:outline-none focus:ring-1 focus:ring-blue-400"
      onChange={e => setLocal(e.target.value)}
      onFocus={e => e.target.select()}
      onBlur={() => {
        const n = parseInt(local || '0', 10)
        onChange(isNaN(n) || n < 0 ? 0 : n)
      }}
    />
  )
}

export default function CuttingTab({
  productId, productCode, productName, onStageChange,
}: { productId: string; productCode: string; productName: string; onStageChange: (s: ProductStage) => void }) {
  const supabase = createClient()
  const [data, setData] = useState<CuttingRow>(EMPTY(productId))
  const [loading, setLoading] = useState(true)
  const logTimer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    supabase.from('cutting').select('id,product_id,start_date,color_1_name,color_1_qty,color_2_name,color_2_qty,color_3_name,color_3_qty,color_4_name,color_4_qty,color_5_name,color_5_qty,color_6_name,color_6_qty,total_kg').eq('product_id', productId).maybeSingle()
      .then(({ data: row }) => {
        if (row) setData(row as CuttingRow)
        setLoading(false)
      })
  }, [productId, supabase])

  const total = COLORS.reduce((s, n) => s + (data[`color_${n}_qty`] ?? 0), 0)

  const save = async (updated: CuttingRow) => {
    const { error } = await supabase.from('cutting').upsert(
      {
        product_id:   productId,
        start_date:   updated.start_date,
        color_1_name: updated.color_1_name, color_1_qty: updated.color_1_qty,
        color_2_name: updated.color_2_name, color_2_qty: updated.color_2_qty,
        color_3_name: updated.color_3_name, color_3_qty: updated.color_3_qty,
        color_4_name: updated.color_4_name, color_4_qty: updated.color_4_qty,
        color_5_name: updated.color_5_name, color_5_qty: updated.color_5_qty,
        color_6_name: updated.color_6_name, color_6_qty: updated.color_6_qty,
        total_kg:     updated.total_kg,
      },
      { onConflict: 'product_id' }
    )
    if (error) { toast.error('Save failed'); return }
    await refreshProductStage(supabase, productId, onStageChange)
    clearTimeout(logTimer.current)
    logTimer.current = setTimeout(() => {
      const total = COLORS.reduce((s, n) => s + (updated[`color_${n}_qty`] ?? 0), 0)
      const colorParts = COLORS
        .map(n => updated[`color_${n}_name`] ? `${updated[`color_${n}_name`]}: ${updated[`color_${n}_qty`]}` : null)
        .filter(Boolean).join(' · ')
      logActivity(supabase, productId, productCode, productName, 'Cutting',
        `Total: ${total} pcs${colorParts ? ` · ${colorParts}` : ''}`)
    }, 1500)
  }

  const update = (field: keyof CuttingRow, value: unknown) => {
    const updated = { ...data, [field]: value }
    setData(updated)
    save(updated)
  }

  if (loading) return <div className="space-y-3 p-4">{Array.from({length:6}).map((_,i)=><Skeleton key={i} className="h-8 w-full"/>)}</div>

  return (
    <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      {/* Left — color table */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <label className="text-sm text-slate-600 w-24">Start Date</label>
          <input
            type="date"
            value={data.start_date ?? ''}
            className="border rounded px-2 py-1 text-sm w-44 focus:outline-none focus:ring-1 focus:ring-blue-400"
            onChange={e => setData(d => ({ ...d, start_date: e.target.value || null }))}
            onBlur={e => { const u = { ...data, start_date: e.target.value || null }; setData(u); save(u) }}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-slate-500 text-xs">
                <th className="text-left pb-2 pr-4">Color</th>
                <th className="text-right pb-2 pr-4">Quantity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {COLORS.map(n => (
                <tr key={n} className="py-1">
                  <td className="pr-4 py-2">
                    <Select
                      value={data[`color_${n}_name`] ?? ''}
                      onValueChange={v => update(`color_${n}_name`, v || null)}
                    >
                      <SelectTrigger className="w-44 h-8 text-sm">
                        <SelectValue placeholder={`Color ${n}`} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">— None —</SelectItem>
                        {COLOR_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="py-2 text-right pr-4">
                    <NumInput
                      value={data[`color_${n}_qty`]}
                      onChange={v => update(`color_${n}_qty`, v)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-300 font-semibold">
                <td className="pt-3 text-slate-700">Total Pieces</td>
                <td className="pt-3 text-right pr-4 text-blue-700 text-base">{total.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="flex items-center gap-3 pt-2 border-t">
          <label className="text-sm text-slate-600 w-24">Total KG</label>
          <input
            type="number" min={0} step={0.1}
            value={data.total_kg ?? ''}
            placeholder="0.0"
            className="w-28 border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
            onChange={e => setData(d => ({ ...d, total_kg: e.target.value === '' ? null : parseFloat(e.target.value) }))}
            onBlur={() => save(data)}
          />
          <span className="text-xs text-slate-400">kg</span>
        </div>
      </div>

      {/* Right — summary */}
      {total > 0 && (
        <div className="rounded-lg border border-blue-100 bg-blue-50 p-5 space-y-3">
          <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide">Cutting Summary</p>
          <div className="space-y-2">
            {COLORS.filter(n => data[`color_${n}_name`]).map(n => (
              <div key={n} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{data[`color_${n}_name`]}</span>
                <span className="font-semibold text-slate-800">{(data[`color_${n}_qty`] as number).toLocaleString()} pcs</span>
              </div>
            ))}
          </div>
          <div className="border-t border-blue-200 pt-3 flex justify-between text-sm font-bold">
            <span className="text-blue-700">Total Cut</span>
            <span className="text-blue-700">{total.toLocaleString()} pcs</span>
          </div>
          {data.total_kg && (
            <div className="flex justify-between text-sm text-slate-500">
              <span>Fabric weight</span>
              <span>{data.total_kg} kg</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
