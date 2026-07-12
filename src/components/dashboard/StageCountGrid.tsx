import Link from 'next/link'
import { PRODUCT_STAGES } from '@/constants'
import type { ProductStage } from '@/types/app'

type Props = { counts: Record<string, number> }

const STAGE_STYLES: Record<ProductStage, { bg: string; text: string; border: string }> = {
  Cutting:    { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200' },
  Printing:   { bg: 'bg-teal-50',   text: 'text-teal-700',   border: 'border-teal-200' },
  Sewing:     { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  QC:         { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200' },
  Finishing:  { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  Dispatched: { bg: 'bg-sky-50',    text: 'text-sky-700',    border: 'border-sky-200' },
  Completed:  { bg: 'bg-slate-50',  text: 'text-slate-600',  border: 'border-slate-200' },
}

export default function StageCountGrid({ counts }: Props) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-slate-700 mb-3">Products by Stage</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {PRODUCT_STAGES.map(stage => {
          const s = STAGE_STYLES[stage]
          const count = counts[stage] ?? 0
          return (
            <Link
              key={stage}
              href={`/dashboard/products?stage=${encodeURIComponent(stage)}`}
              className={`rounded-lg border ${s.bg} ${s.border} ${s.text} p-3 text-center hover:shadow-md transition-shadow cursor-pointer`}
            >
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-xs font-medium mt-0.5 opacity-80">{stage}</p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
