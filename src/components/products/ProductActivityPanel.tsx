'use client'
import { formatDate } from '@/lib/utils/formatters'
import Link from 'next/link'
import { Calendar, FileText } from 'lucide-react'

type DailyRow = {
  entry_date: string
  design_code: string
  notes: string | null
}

export type { DailyRow }

export default function ProductActivityPanel({ rows }: { rows: DailyRow[] }) {
  if (!rows.length) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-5 py-3 border-b flex items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-semibold text-slate-700">Daily Activity Log</span>
        </div>
        <p className="px-5 py-6 text-sm text-slate-400 text-center">
          No daily entries linked to this product yet.{' '}
          <Link href="/dashboard/daily" className="text-blue-600 hover:underline">Go to Daily Entry →</Link>
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-3 border-b flex items-center gap-2">
        <Calendar className="h-4 w-4 text-slate-400" />
        <span className="text-sm font-semibold text-slate-700">Daily Activity Log</span>
        <span className="text-xs text-slate-400 ml-1">— {rows.length} linked entr{rows.length !== 1 ? 'ies' : 'y'}</span>
        <Link href="/dashboard/daily" className="ml-auto text-xs text-blue-600 hover:underline">Add entry →</Link>
      </div>

      <div className="divide-y divide-slate-100">
        {rows.map((r, i) => (
          <div key={i} className="flex items-start gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
            <span className="text-xs font-medium text-slate-500 whitespace-nowrap pt-0.5 w-24 shrink-0">
              {formatDate(r.entry_date)}
            </span>
            <span className="text-xs font-mono text-blue-700 shrink-0 pt-0.5">{r.design_code}</span>
            {r.notes ? (
              <span className="text-xs text-slate-600 flex items-start gap-1">
                <FileText className="h-3 w-3 mt-0.5 text-slate-400 shrink-0" />
                {r.notes}
              </span>
            ) : (
              <span className="text-xs text-slate-300 italic">no notes</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
