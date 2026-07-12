import type { ProductionEntry } from '@/types/app'

export const getCutTotal = (e: ProductionEntry): number =>
  (e.cut_color_1 ?? 0) +
  (e.cut_color_2 ?? 0) +
  (e.cut_color_3 ?? 0) +
  (e.cut_color_4 ?? 0) +
  (e.cut_color_5 ?? 0)

export const getPendingAtPE = (e: ProductionEntry): number =>
  (e.pe_sending_qty ?? 0) - (e.pe_received_qty ?? 0)

export const getPendingAtSwing = (e: ProductionEntry): number =>
  (e.swing_out_qty ?? 0) - (e.swing_in_qty ?? 0)

export const getQCRejectRate = (e: ProductionEntry): number => {
  const recv = e.qc_received_qty ?? 0
  if (recv === 0) return 0
  return ((e.qc_reject_qty ?? 0) / recv) * 100
}
