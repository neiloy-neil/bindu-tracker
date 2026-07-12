import { format, parseISO } from 'date-fns'

export const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '—'
  try {
    return format(parseISO(dateStr), 'dd MMM yyyy')
  } catch {
    return dateStr
  }
}

export const formatDateShort = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '—'
  try {
    return format(parseISO(dateStr), 'dd/MM/yyyy')
  } catch {
    return dateStr
  }
}

export const toISODate = (date: Date): string => format(date, 'yyyy-MM-dd')

export const formatQty = (n: number | null | undefined): string => {
  if (n === null || n === undefined || n === 0) return ''
  return n.toLocaleString()
}
