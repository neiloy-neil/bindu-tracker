'use client'
import { AlertTriangle, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { differenceInDays, parseISO } from 'date-fns'
import { formatDate } from '@/lib/utils/formatters'
import type { ProductStage } from '@/types/app'

type AtRiskProduct = {
  id: string
  product_code: string
  product_name: string
  current_stage: ProductStage
  target_dispatch_date: string
}

const STAGE_STYLES: Record<ProductStage, string> = {
  Cutting:    'bg-blue-100 text-blue-700',
  Printing:   'bg-teal-100 text-teal-700',
  Sewing:     'bg-orange-100 text-orange-700',
  QC:         'bg-green-100 text-green-700',
  Finishing:  'bg-purple-100 text-purple-700',
  Dispatched: 'bg-sky-100 text-sky-700',
  Completed:  'bg-slate-100 text-slate-600',
}

export default function AtRiskPanel({ products }: { products: AtRiskProduct[] }) {
  if (!products.length) return null

  return (
    <div className="rounded-lg overflow-hidden shadow-md ring-1 ring-red-600 bg-red-600 mb-6">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-red-500/30">
        <AlertTriangle className="h-5 w-5 text-white animate-pulse shrink-0" />
        <span className="text-sm font-black text-white uppercase tracking-widest">
          CRITICAL: {products.length} {products.length === 1 ? 'order' : 'orders'} at risk of missing dispatch target
        </span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-red-500/20 bg-red-500/10 backdrop-blur-sm">
        {products.map(p => {
          const days = differenceInDays(parseISO(p.target_dispatch_date), new Date())
          const overdue = days < 0
          const urgent = days === 0

          return (
            <Link
              key={p.id}
              href={`/dashboard/products/${p.id}`}
              className="flex items-center gap-4 px-5 py-3 hover:bg-white/10 transition-colors group"
            >
              {/* Days chip */}
              <div className={`shrink-0 w-20 text-center rounded-md px-2 py-1.5 text-[11px] font-black tabular-nums shadow-sm ${
                overdue ? 'bg-red-800 text-white animate-pulse'
                : urgent ? 'bg-amber-400 text-amber-950'
                : 'bg-white/20 text-white'
              }`}>
                {overdue ? `${Math.abs(days)}d OVERDUE` : urgent ? 'DUE TODAY' : `${days}d left`}
              </div>

              {/* Product info */}
              <div className="flex-1 min-w-0 flex items-center gap-3">
                <span className="font-mono font-bold text-sm text-white whitespace-nowrap">{p.product_code}</span>
                <span className={`text-[10px] px-2 py-1 rounded font-bold whitespace-nowrap shadow-sm uppercase tracking-wider ${
                  overdue ? 'bg-white text-red-600' : 'bg-red-700/50 text-white'
                }`}>
                  Stuck in: {p.current_stage}
                </span>
                <span className="text-xs text-red-100/80 truncate hidden sm:block">{p.product_name}</span>
              </div>

              {/* Target date */}
              <span className="shrink-0 text-xs text-red-100 font-semibold hidden md:block">
                Target: {formatDate(p.target_dispatch_date)}
              </span>

              <ArrowRight className="h-4 w-4 text-red-200 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity group-hover:translate-x-1" />
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export type { AtRiskProduct }
