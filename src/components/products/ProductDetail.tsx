'use client'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils/formatters'
import { logActivity } from '@/lib/utils/logActivity'
import { createClient } from '@/lib/supabase/client'
import type { ProductStage } from '@/types/app'
import { PRODUCT_STAGES } from '@/constants'
import { AlertTriangle, Check } from 'lucide-react'
import Link from 'next/link'
import { differenceInDays, parseISO } from 'date-fns'
import ProductActivityPanel from './ProductActivityPanel'

type DailyRow = { entry_date: string; design_code: string; notes: string | null }
import CuttingTab from './stages/CuttingTab'
import PrintingTab from './stages/PrintingTab'
import SewingTab from './stages/SewingTab'
import QCTab from './stages/QCTab'
import FinishingTab from './stages/FinishingTab'
import DispatchTab from './stages/DispatchTab'
import StockTab from './stages/StockTab'

type Product = {
  id: string
  product_code: string
  product_name: string
  image_url: string | null
  production_start_date: string | null
  complete_date: string | null
  current_stage: ProductStage
  notes: string | null
  target_qty: number | null
  target_dispatch_date: string | null
  created_at: string
  updated_at: string
}

const STAGE_COLORS: Record<ProductStage, string> = {
  Cutting:    'bg-slate-100 text-slate-700',
  Printing:   'bg-slate-100 text-slate-700',
  Sewing:     'bg-slate-100 text-slate-700',
  QC:         'bg-slate-100 text-slate-700',
  Finishing:  'bg-slate-100 text-slate-700',
  Dispatched: 'bg-slate-100 text-slate-700',
  Completed:  'bg-slate-50 text-slate-500',
}

export default function ProductDetail({
  product,
  totalDispatched: initialDispatched = 0,
  dailyActivity = [],
}: {
  product: Product
  totalDispatched?: number
  dailyActivity?: DailyRow[]
}) {
  const supabase = createClient()
  const [currentStage, setCurrentStage] = useState<ProductStage>(product.current_stage)
  const activeTabValue = product.current_stage.toLowerCase() === 'dispatched' || product.current_stage.toLowerCase() === 'completed' ? 'dispatch' : product.current_stage.toLowerCase()
  const [activeTab, setActiveTab] = useState<string>(activeTabValue)
  const [totalDispatched, setTotalDispatched] = useState(initialDispatched)

  const handleStageChange = (stage: ProductStage) => {
    setCurrentStage(stage)
    setActiveTab(stage.toLowerCase() === 'dispatched' || stage.toLowerCase() === 'completed' ? 'dispatch' : stage.toLowerCase())
    logActivity(supabase, product.id, product.product_code, product.product_name, 'Stage', `Moved to ${stage}`)
  }
  const stageIdx = PRODUCT_STAGES.indexOf(currentStage)

  // Dispatch progress
  const dispatchPct = product.target_qty && product.target_qty > 0
    ? Math.min(Math.round((totalDispatched / product.target_qty) * 100), 100)
    : null

  // Days until dispatch target
  const daysUntil = product.target_dispatch_date
    ? differenceInDays(parseISO(product.target_dispatch_date), new Date())
    : null

  const isAtRisk = daysUntil !== null && daysUntil <= 5
    && currentStage !== 'Dispatched' && currentStage !== 'Completed'

  const STAGE_RAIL: Record<ProductStage, string> = {
    Cutting:    'bg-blue-500',
    Printing:   'bg-teal-500',
    Sewing:     'bg-orange-500',
    QC:         'bg-green-500',
    Finishing:  'bg-purple-500',
    Dispatched: 'bg-sky-500',
    Completed:  'bg-slate-400',
  }

  const STAGE_ACCENT: Record<ProductStage, string> = {
    Cutting:    'border-l-blue-500',
    Printing:   'border-l-teal-500',
    Sewing:     'border-l-orange-500',
    QC:         'border-l-green-500',
    Finishing:  'border-l-purple-500',
    Dispatched: 'border-l-sky-500',
    Completed:  'border-l-slate-400',
  }

  const TAB_STAGES = [
    { value: 'cutting',   label: 'Cutting',   step: 1, stage: 'Cutting'    as ProductStage | null, rail: 'bg-blue-500',   active: 'data-[state=active]:border-b-blue-500 data-[state=active]:text-blue-700'   },
    { value: 'printing',  label: 'Printing',  step: 2, stage: 'Printing'   as ProductStage | null, rail: 'bg-teal-500',   active: 'data-[state=active]:border-b-teal-500 data-[state=active]:text-teal-700'   },
    { value: 'sewing',    label: 'Sewing',    step: 3, stage: 'Sewing'     as ProductStage | null, rail: 'bg-orange-500', active: 'data-[state=active]:border-b-orange-500 data-[state=active]:text-orange-700' },
    { value: 'qc',        label: 'QC',        step: 4, stage: 'QC'         as ProductStage | null, rail: 'bg-green-500',  active: 'data-[state=active]:border-b-green-500 data-[state=active]:text-green-700'  },
    { value: 'finishing', label: 'Finishing', step: 5, stage: 'Finishing'  as ProductStage | null, rail: 'bg-purple-500', active: 'data-[state=active]:border-b-purple-500 data-[state=active]:text-purple-700' },
    { value: 'dispatch',  label: 'Dispatch',  step: 6, stage: 'Dispatched' as ProductStage | null, rail: 'bg-sky-500',    active: 'data-[state=active]:border-b-sky-500 data-[state=active]:text-sky-700'     },
    { value: 'stock',     label: 'Stock',     step: 7, stage: null,                                 rail: 'bg-slate-400', active: 'data-[state=active]:border-b-slate-400 data-[state=active]:text-slate-600'  },
  ] as const

  return (
    <div className="space-y-4 max-w-5xl">
      {/* Breadcrumb + header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="text-[11px] text-slate-400 mb-1">
            <Link href="/dashboard/products" className="hover:text-slate-600 transition-colors">Products</Link>
            <span className="mx-1.5 text-slate-300">/</span>
            <span className="text-slate-500 font-medium">{product.product_code}</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-lg font-bold text-slate-800 font-mono tracking-tight">{product.product_code}</h2>
            <Badge className={`${STAGE_COLORS[currentStage]} text-[11px]`} variant="secondary">{currentStage}</Badge>
            {isAtRisk && (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                <AlertTriangle className="h-3 w-3" />
                {daysUntil === 0 ? 'Due today' : daysUntil !== null && daysUntil < 0 ? `${Math.abs(daysUntil)}d overdue` : `${daysUntil}d left`}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-0.5">{product.product_name}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/products/${product.id}/edit`}>
            <Button variant="outline" size="sm" className="h-7 text-[11px] px-3">Edit</Button>
          </Link>
        </div>
      </div>

      {/* Info strip */}
      <div className={`bg-white rounded-md border border-slate-200 shadow-sm px-4 py-3 flex flex-wrap gap-6 items-center`}>
        {product.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image_url} alt="" className="w-12 h-12 rounded object-cover border border-slate-200 shrink-0" />
        )}
        <div className="flex flex-wrap gap-6 flex-1">
          {product.production_start_date && (
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">Start Date</p>
              <p className="text-[13px] font-semibold text-slate-700">{formatDate(product.production_start_date)}</p>
            </div>
          )}
          {product.target_qty && (
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">Target Qty</p>
              <p className="text-[13px] font-semibold text-slate-700 tabular-nums">{product.target_qty.toLocaleString()} pcs</p>
            </div>
          )}
          {product.target_dispatch_date && (
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">Dispatch Target</p>
              <p className={`text-[13px] font-semibold tabular-nums ${isAtRisk ? 'text-red-600' : 'text-slate-700'}`}>{formatDate(product.target_dispatch_date)}</p>
            </div>
          )}
          {dispatchPct !== null && (
            <div className="min-w-[140px]">
              <div className="flex justify-between text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400 mb-1">
                <span>Dispatch Progress</span>
                <span className="tabular-nums">{dispatchPct}%</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${dispatchPct >= 100 ? 'bg-green-500' : dispatchPct >= 60 ? 'bg-sky-500' : 'bg-blue-400'}`}
                  style={{ width: `${dispatchPct}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5 tabular-nums">{totalDispatched.toLocaleString()} / {product.target_qty!.toLocaleString()}</p>
            </div>
          )}
        </div>
        {product.notes && <p className="w-full text-[11px] text-slate-400 italic border-t border-slate-100 pt-2 mt-1">{product.notes}</p>}
      </div>

      {/* Ultra-Compact Flex Tab-Cards */}
      <div className="flex w-full gap-2 pb-2 overflow-x-auto hide-scrollbar">
        {TAB_STAGES.map(({ value, label, step, stage, rail }) => {
          const isActive = activeTab === value
          const isCurrent = stage ? currentStage === stage : false
          const isDone = stage ? PRODUCT_STAGES.indexOf(currentStage) > PRODUCT_STAGES.indexOf(stage as ProductStage) : false

          return (
            <div 
              key={value} 
              onClick={() => setActiveTab(value)}
              className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 px-2 py-2 bg-white rounded-md border cursor-pointer transition-all duration-200 select-none ${isActive ? `border-slate-300 shadow-sm ring-1 ${rail.replace('bg-', 'ring-')}` : 'border-slate-200 shadow-sm opacity-70 hover:opacity-100'}`}
            >
              <span className={`text-[10px] font-bold rounded flex shrink-0 items-center justify-center w-5 h-5 ${isDone ? 'bg-green-100 text-green-700' : isCurrent ? `${rail} text-white` : 'bg-slate-100 text-slate-500'}`}>
                {isDone ? <Check className="w-3 h-3" /> : step}
              </span>
              <span className={`text-[12px] font-bold truncate ${isActive ? 'text-slate-800' : 'text-slate-600'}`}>{label}</span>
            </div>
          )
        })}
      </div>

      {/* Tab Content Area */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-700">Stage Details</h3>
        </div>
        <div className="p-5">
          {activeTab === 'cutting' && <CuttingTab productId={product.id} productCode={product.product_code} productName={product.product_name} onStageChange={handleStageChange} />}
          {activeTab === 'printing' && <PrintingTab productId={product.id} productCode={product.product_code} productName={product.product_name} onStageChange={handleStageChange} />}
          {activeTab === 'sewing' && <SewingTab productId={product.id} productCode={product.product_code} productName={product.product_name} onStageChange={handleStageChange} />}
          {activeTab === 'qc' && <QCTab productId={product.id} productCode={product.product_code} productName={product.product_name} onStageChange={handleStageChange} />}
          {activeTab === 'finishing' && <FinishingTab productId={product.id} productCode={product.product_code} productName={product.product_name} onStageChange={handleStageChange} />}
          {activeTab === 'dispatch' && <DispatchTab productId={product.id} productCode={product.product_code} productName={product.product_name} onTotalChange={setTotalDispatched} onStageChange={s => setCurrentStage(s as ProductStage)} />}
          {activeTab === 'stock' && <StockTab productId={product.id} />}
        </div>
      </div>

      {/* Daily activity log */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-card">
        <div className="px-4 py-3 border-b border-slate-100">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Daily Activity Log</p>
        </div>
        <ProductActivityPanel rows={dailyActivity} />
      </div>
    </div>
  )
}
