'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { COLOR_OPTIONS } from '@/constants'

type StockRow = {
  product_id: string
  color_1_name: string | null; color_1_qty: number
  color_2_name: string | null; color_2_qty: number
  color_3_name: string | null; color_3_qty: number
  color_4_name: string | null; color_4_qty: number
  color_5_name: string | null; color_5_qty: number
  color_6_name: string | null; color_6_qty: number
}

const EMPTY = (productId: string): StockRow => ({
  product_id: productId,
  color_1_name: null, color_1_qty: 0,
  color_2_name: null, color_2_qty: 0,
  color_3_name: null, color_3_qty: 0,
  color_4_name: null, color_4_qty: 0,
  color_5_name: null, color_5_qty: 0,
  color_6_name: null, color_6_qty: 0,
})

const COLORS = [1,2,3,4,5,6] as const

export default function StockTab({ productId }: { productId: string }) {
  const supabase = createClient()
  const [data, setData] = useState<StockRow>(EMPTY(productId))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('warehouse_stock').select('*').eq('product_id', productId).maybeSingle()
      .then(({ data: row }) => {
        if (row) setData(row as StockRow)
        setLoading(false)
      })
  }, [productId, supabase])

  const total = COLORS.reduce((s, n) => s + (data[`color_${n}_qty`] ?? 0), 0)

  const save = async (updated: StockRow) => {
    const { error } = await supabase.from('warehouse_stock').upsert(
      { ...updated, product_id: productId },
      { onConflict: 'product_id' }
    )
    if (error) toast.error('Save failed')
  }

  const update = (field: keyof StockRow, value: unknown) => {
    const updated = { ...data, [field]: value }
    setData(updated)
    save(updated)
  }

  if (loading) return <div className="space-y-3 p-4">{Array.from({length:6}).map((_,i)=><Skeleton key={i} className="h-8 w-full"/>)}</div>

  return (
    <div className="p-4 space-y-4">
      <p className="text-xs text-slate-500">Current warehouse stock by color — update manually after counting.</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-slate-500 text-xs">
              <th className="text-left pb-2 pr-4">Color</th>
              <th className="text-right pb-2 pr-4">Stock QTY</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {COLORS.map(n => (
              <tr key={n}>
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
                  <input
                    type="number" min={0}
                    className="w-20 border rounded px-2 py-1 text-sm text-right focus:outline-none focus:ring-1 focus:ring-blue-400"
                    value={data[`color_${n}_qty`] || ''}
                    placeholder="0"
                    onChange={e => setData(d => ({ ...d, [`color_${n}_qty`]: parseInt(e.target.value)||0 }))}
                    onFocus={e => e.target.select()}
                    onBlur={() => save(data)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-300 font-semibold">
              <td className="pt-3 text-slate-700">Total Stock</td>
              <td className="pt-3 text-right pr-4 text-blue-700 text-base">{total.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
