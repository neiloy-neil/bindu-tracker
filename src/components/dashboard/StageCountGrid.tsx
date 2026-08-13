import Link from 'next/link'
import { PRODUCT_STAGES } from '@/constants'
import type { ProductStage } from '@/types/app'

type Props = { counts: Record<string, number> }

const STAGE_CONFIG: Record<ProductStage, { num: string; rail: string; dot: string }> = {
  Cutting:    { num: 'text-blue-600',   rail: 'bg-blue-500',   dot: 'bg-blue-400' },
  Printing:   { num: 'text-teal-600',   rail: 'bg-teal-500',   dot: 'bg-teal-400' },
  Sewing:     { num: 'text-orange-600', rail: 'bg-orange-500', dot: 'bg-orange-400' },
  QC:         { num: 'text-green-600',  rail: 'bg-green-500',  dot: 'bg-green-400' },
  Finishing:  { num: 'text-purple-600', rail: 'bg-purple-500', dot: 'bg-purple-400' },
  Dispatched: { num: 'text-sky-600',    rail: 'bg-sky-500',    dot: 'bg-sky-400' },
  Completed:  { num: 'text-slate-500',  rail: 'bg-slate-400',  dot: 'bg-slate-300' },
}

export default function StageCountGrid({ counts }: Props) {
  const total = PRODUCT_STAGES.reduce((s, st) => s + (counts[st] ?? 0), 0)

  return (
    <div className="py-2">
      <div className="flex items-center justify-between mb-6">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Production Pipeline</p>
        {total > 0 && (
          <span className="text-xs font-bold text-slate-400 tabular-nums bg-slate-100 px-2 py-0.5 rounded-full">{total} total</span>
        )}
      </div>

      {/* Pipeline flow */}
      <div className="overflow-x-auto -mx-1 pb-2">
        <div className="flex items-stretch min-w-[600px] px-1 relative">
          {/* Continuous background rail */}
          <div className="absolute left-6 right-6 top-[28px] h-1 bg-slate-100 rounded-full z-0" />
          
          {PRODUCT_STAGES.map((stage, i) => {
            const count = counts[stage] ?? 0
            const cfg = STAGE_CONFIG[stage]
            const active = count > 0

            return (
              <div key={stage} className="flex flex-col items-center flex-1 relative z-10 group">
                <Link
                  href={`/dashboard/products?stage=${encodeURIComponent(stage)}`}
                  className={`flex flex-col items-center w-full transition-all duration-300 ${
                    active ? 'cursor-pointer hover:-translate-y-1' : 'cursor-default opacity-60'
                  }`}
                >
                  {/* Stage Node */}
                  <div className={`mb-4 w-12 h-14 rounded-xl flex items-center justify-center transition-all shadow-sm ${
                    active ? `bg-white border-2 border-${cfg.rail.split('-')[1]}-500 shadow-md group-hover:shadow-lg` : 'bg-slate-50 border-2 border-slate-200'
                  }`}>
                    <span className={`text-xl font-black tabular-nums transition-colors ${
                      active ? cfg.num : 'text-slate-400'
                    }`}>
                      {count}
                    </span>
                  </div>

                  {/* Stage label */}
                  <span className={`text-[10px] font-bold uppercase tracking-widest text-center transition-colors ${
                    active ? 'text-slate-700' : 'text-slate-400'
                  }`}>
                    {stage}
                  </span>
                  
                  {active && (
                    <span className="text-[10px] text-slate-400 font-medium mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      Click to view
                    </span>
                  )}
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
