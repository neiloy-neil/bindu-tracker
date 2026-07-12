'use client'
import { AlertTriangle, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { differenceInDays, parseISO } from 'date-fns'
import { BentoCard } from '@/components/shared/BentoCard'
import { formatDate } from '@/lib/utils/formatters'
import type { ProductStage } from '@/types/app'

type AtRiskProduct = {
  id: string
  product_code: string
  product_name: string
  current_stage: ProductStage
  target_dispatch_date: string
}

const STAGE_COLORS: Record<ProductStage, string> = {
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
    <BentoCard noPadding className="border-red-200 bg-red-50">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-red-200 bg-red-100/60">
        <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
        <span className="text-sm font-semibold text-red-700">
          {products.length} order{products.length !== 1 ? 's' : ''} at risk
        </span>
        <span className="text-xs text-red-500 ml-1">— dispatch target within 5 days but not yet dispatched</span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-red-100">
        {products.map(p => {
          const days = differenceInDays(parseISO(p.target_dispatch_date), new Date())
          return (
            <Link
              key={p.id}
              href={`/dashboard/products/${p.id}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-red-100/40 transition-colors group"
            >
              {/* Days chip */}
              <div className={`shrink-0 w-16 text-center rounded-md px-2 py-1 text-xs font-bold ${
                days < 0
                  ? 'bg-red-600 text-white'
                  : days === 0
                  ? 'bg-red-500 text-white'
                  : 'bg-red-200 text-red-800'
              }`}>
                {days < 0
                  ? `${Math.abs(days)}d over`
                  : days === 0
                  ? 'TODAY'
                  : `${days}d left`}
              </div>

              {/* Product info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-sm text-slate-800">{p.product_code}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${STAGE_COLORS[p.current_stage]}`}>
                    {p.current_stage}
                  </span>
                </div>
                <p className="text-xs text-slate-500 truncate">{p.product_name}</p>
              </div>

              {/* Target date */}
              <div className="shrink-0 text-xs text-red-600 font-medium hidden sm:block">
                {formatDate(p.target_dispatch_date)}
              </div>

              <ArrowRight className="h-3.5 w-3.5 text-red-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          )
        })}
      </div>
    </BentoCard>
  )
}

export type { AtRiskProduct }
