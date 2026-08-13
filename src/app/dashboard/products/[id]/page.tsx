import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProductDetail from '@/components/products/ProductDetail'

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const [productRes, dispatchRes, activityRes] = await Promise.all([
    supabase.from('products').select('*').eq('id', id).single(),
    supabase.from('branch_dispatch').select('qty').eq('product_id', id),
    supabase.from('production_entries')
      .select('entry_date, design_code, notes')
      .eq('product_id', id)
      .order('entry_date'),
  ])

  if (!productRes.data) notFound()

  const totalDispatched = (dispatchRes.data ?? []).reduce((s, r) => s + (r.qty ?? 0), 0)
  const dailyActivity = activityRes.data ?? []

  return (
    <ProductDetail
      product={productRes.data}
      totalDispatched={totalDispatched}
      dailyActivity={dailyActivity}
    />
  )
}
