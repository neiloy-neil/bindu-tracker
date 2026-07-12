import type { SupabaseClient } from '@supabase/supabase-js'
import type { ProductStage } from '@/types/app'

export async function refreshProductStage(
  supabase: SupabaseClient,
  productId: string,
  onStageChange?: (stage: ProductStage) => void
): Promise<ProductStage> {
  const [
    { data: product },
    { data: cut },
    { data: print },
    { data: sew },
    { data: qc },
    { data: finish },
  ] = await Promise.all([
    supabase.from('products').select('complete_date').eq('id', productId).single(),
    supabase.from('cutting').select('total_qty').eq('product_id', productId).maybeSingle(),
    supabase.from('printing').select('out_qty, status').eq('product_id', productId).maybeSingle(),
    supabase.from('sewing').select('out_qty, status').eq('product_id', productId).maybeSingle(),
    supabase.from('qc').select('in_qty, out_qty, status').eq('product_id', productId).maybeSingle(),
    supabase.from('finishing').select('received_qty').eq('product_id', productId).maybeSingle(),
  ])

  let stage: ProductStage = 'Cutting'

  if (product?.complete_date) {
    stage = 'Completed'
  } else if ((finish?.received_qty ?? 0) > 0) {
    // Pieces are in finishing — show Finishing regardless of QC status
    stage = 'Finishing'
  } else if (qc?.status === 'Completed') {
    stage = 'Finishing'
  } else if ((qc?.in_qty ?? 0) > 0) {
    // QC data entered — advance to QC even if sewing was skipped
    stage = 'QC'
  } else if (sew?.status === 'Completed') {
    stage = 'QC'
  } else if ((sew?.out_qty ?? 0) > 0) {
    stage = 'Sewing'
  } else if (print?.status === 'Received from Print') {
    stage = 'Sewing'
  } else if ((print?.out_qty ?? 0) > 0) {
    stage = 'Printing'
  } else if ((cut?.total_qty ?? 0) > 0) {
    stage = 'Cutting'
  }

  await supabase.from('products').update({ current_stage: stage }).eq('id', productId)
  onStageChange?.(stage)
  return stage
}
