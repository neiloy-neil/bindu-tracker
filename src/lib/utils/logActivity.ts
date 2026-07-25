import type { SupabaseClient } from '@supabase/supabase-js'

export async function logActivity(
  supabase: SupabaseClient,
  productId: string,
  productCode: string,
  productName: string,
  action: string,
  details?: string
) {
  await supabase.from('product_activity_log').insert({
    product_id: productId,
    product_code: productCode,
    product_name: productName,
    action,
    details: details ?? null,
  })
}
