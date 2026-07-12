import type { PRODUCT_STAGES, PRINT_STATUS, SEW_STATUS, QC_STATUS } from '@/constants'

export type VendorType = 'printing' | 'sewing' | 'both'

export type Vendor = {
  id: string
  name: string
  type: VendorType
  active: boolean
  created_at: string
}

export type ProductStage = (typeof PRODUCT_STAGES)[number]
export type PrintStatus  = (typeof PRINT_STATUS)[number]
export type SewStatus    = (typeof SEW_STATUS)[number]
export type QcStatus     = (typeof QC_STATUS)[number]

export type ColorPair = {
  name: string | null
  qty: number
}

export type CuttingData = {
  colors: [ColorPair, ColorPair, ColorPair, ColorPair, ColorPair, ColorPair]
  total_qty: number
  total_kg: number | null
}

export type DispatchSlot = {
  dispatch_no: 1 | 2 | 3
  dispatch_date: string | null
  qty: number
}

export type BranchDispatchMap = Record<string, [DispatchSlot, DispatchSlot, DispatchSlot]>

export type ProductSummaryRow = {
  id: string
  product_code: string
  product_name: string
  image_url: string | null
  production_start_date: string | null
  complete_date: string | null
  current_stage: ProductStage
  notes: string | null
  cutting_total_qty: number | null
  cutting_total_kg: number | null
  print_status: PrintStatus | null
  sew_status: SewStatus | null
  qc_status: QcStatus | null
  qc_out_qty: number | null
  qc_reject_qty: number | null
  finishing_qty: number | null
  stock_total: number | null
  created_at: string
  updated_at: string
}

// Daily entry sheet
export type ProductionEntry = {
  id: string
  entry_date: string
  design_code: string
  branch_id: string | null
  product_id: string | null
  cut_color_1: number
  cut_color_2: number
  cut_color_3: number
  cut_color_4: number
  cut_color_5: number
  pe_vendor_name: string | null
  pe_sending_qty: number
  pe_received_qty: number
  swing_vendor_name: string | null
  swing_out_qty: number
  swing_in_qty: number
  qc_received_qty: number
  qc_output_qty: number
  qc_reject_qty: number
  qc_alter_qty: number
  qc_spot_qty: number
  finished_goods_qty: number
  dispatch_retail_qty: number
  dispatch_wholesale_qty: number
  stock_warehouse: number
  stock_cutting: number
  stock_swingline: number
  stock_short: number
  created_by: string | null
  created_at: string
  updated_at: string
}
