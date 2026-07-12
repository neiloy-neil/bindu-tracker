import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProductDetail from '@/components/products/ProductDetail'
import type { DailyRow } from '@/components/products/ProductActivityPanel'

export default async function ProductPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const [productRes, dispatchRes, activityRes] = await Promise.all([
    supabase.from('products').select('*').eq('id', params.id).single(),
    supabase.from('branch_dispatch').select('qty').eq('product_id', params.id),
    supabase.from('production_entries')
      .select('entry_date, cut_color_1, cut_color_2, cut_color_3, cut_color_4, cut_color_5, pe_sending_qty, pe_received_qty, swing_out_qty, swing_in_qty, qc_received_qty, qc_output_qty, qc_reject_qty, finished_goods_qty, dispatch_retail_qty, dispatch_wholesale_qty')
      .eq('product_id', params.id)
      .order('entry_date'),
  ])

  if (!productRes.data) notFound()

  const totalDispatched = (dispatchRes.data ?? []).reduce((s, r) => s + (r.qty ?? 0), 0)

  // Aggregate by date (multiple rows per date possible — different branch entries)
  const dateMap = new Map<string, DailyRow>()
  for (const e of activityRes.data ?? []) {
    const cut = (e.cut_color_1||0)+(e.cut_color_2||0)+(e.cut_color_3||0)+(e.cut_color_4||0)+(e.cut_color_5||0)
    const existing = dateMap.get(e.entry_date) ?? {
      entry_date: e.entry_date, cut_total: 0, pe_sending_qty: 0, pe_received_qty: 0,
      swing_out_qty: 0, swing_in_qty: 0, qc_received_qty: 0, qc_output_qty: 0,
      qc_reject_qty: 0, finished_goods_qty: 0, dispatch_retail_qty: 0, dispatch_wholesale_qty: 0,
    }
    existing.cut_total            += cut
    existing.pe_sending_qty       += e.pe_sending_qty   || 0
    existing.pe_received_qty      += e.pe_received_qty  || 0
    existing.swing_out_qty        += e.swing_out_qty    || 0
    existing.swing_in_qty         += e.swing_in_qty     || 0
    existing.qc_received_qty      += e.qc_received_qty  || 0
    existing.qc_output_qty        += e.qc_output_qty    || 0
    existing.qc_reject_qty        += e.qc_reject_qty    || 0
    existing.finished_goods_qty   += e.finished_goods_qty        || 0
    existing.dispatch_retail_qty  += e.dispatch_retail_qty       || 0
    existing.dispatch_wholesale_qty += e.dispatch_wholesale_qty  || 0
    dateMap.set(e.entry_date, existing)
  }
  const dailyActivity = Array.from(dateMap.values())

  return (
    <ProductDetail
      product={productRes.data}
      totalDispatched={totalDispatched}
      dailyActivity={dailyActivity}
    />
  )
}
