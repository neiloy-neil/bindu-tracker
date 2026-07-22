'use client'
import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils/formatters'
import type { ProductStage } from '@/types/app'
import { PRODUCT_STAGES } from '@/constants'
import { CheckCircle2, Circle, AlertTriangle, Target, CalendarClock } from 'lucide-react'
import Link from 'next/link'
import { differenceInDays, parseISO } from 'date-fns'
import { BentoGrid } from '@/components/shared/BentoGrid'
import { BentoCard } from '@/components/shared/BentoCard'
import ProductActivityPanel from './ProductActivityPanel'
import type { DailyRow } from './ProductActivityPanel'
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
  Cutting:    'bg-blue-100 text-blue-700',
  Printing:   'bg-teal-100 text-teal-700',
  Sewing:     'bg-orange-100 text-orange-700',
  QC:         'bg-green-100 text-green-700',
  Finishing:  'bg-purple-100 text-purple-700',
  Dispatched: 'bg-sky-100 text-sky-700',
  Completed:  'bg-slate-100 text-slate-600',
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
  const [currentStage, setCurrentStage] = useState<ProductStage>(product.current_stage)
  const [totalDispatched, setTotalDispatched] = useState(initialDispatched)
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

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Breadcrumb */}
      <div className="text-xs text-slate-400">
        <Link href="/dashboard/products" className="hover:underline">Products</Link>
        {' / '}
        <span className="text-slate-600 font-medium">{product.product_code}</span>
      </div>

      {/* At-risk banner */}
      {isAtRisk && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-red-700 text-sm font-medium">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {daysUntil === 0
            ? 'Target dispatch is TODAY — currently in ' + currentStage
            : daysUntil < 0
            ? `Overdue by ${Math.abs(daysUntil)} day${Math.abs(daysUntil) !== 1 ? 's' : ''} — still in ${currentStage}`
            : `${daysUntil} day${daysUntil !== 1 ? 's' : ''} until target dispatch — currently in ${currentStage}`
          }
        </div>
      )}

      {/* Header Grid */}
      <BentoGrid>
        {/* Main Info */}
        <BentoCard className="col-span-full lg:col-span-2 flex flex-col">
          <div className="flex items-start gap-4 flex-wrap flex-1">
            {product.image_url && (
              <div className="flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={product.image_url} alt={product.product_name} className="w-24 h-24 rounded-lg object-cover border shadow-sm bg-slate-50" />
              </div>
            )}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl font-bold text-slate-800">{product.product_code}</h2>
                <Badge className={STAGE_COLORS[currentStage]} variant="secondary">{currentStage}</Badge>
                <Link href={`/dashboard/products/${product.id}/edit`}>
                  <Button variant="outline" size="sm" className="h-6 text-xs ml-2 px-2">Edit</Button>
                </Link>
              </div>
              <p className="text-slate-600">{product.product_name}</p>
              <div className="flex flex-wrap gap-4 mt-1 text-xs text-slate-500">
                {product.production_start_date && <span>Started: {formatDate(product.production_start_date)}</span>}
                {product.complete_date && <span>Completed: {formatDate(product.complete_date)}</span>}
              </div>
              {product.notes && <p className="text-xs text-slate-400 italic pt-2">{product.notes}</p>}
            </div>
          </div>
        </BentoCard>

        {/* Targets & Stats */}
        <BentoCard className="flex flex-col space-y-5">
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Targets</h3>
            {product.target_qty && (
              <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 border rounded-lg px-3 py-2">
                <Target className="h-4 w-4 text-slate-400" />
                <span className="font-semibold text-slate-800">{product.target_qty.toLocaleString()}</span>
                <span>target pcs</span>
              </div>
            )}
            {product.target_dispatch_date && (
              <div className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2 border ${
                isAtRisk ? 'bg-red-50 border-red-200 text-red-700' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
                <CalendarClock className="h-4 w-4 shrink-0" />
                <span className="font-semibold">{formatDate(product.target_dispatch_date)}</span>
                {daysUntil !== null && (
                  <span className="text-xs ml-1 opacity-80">({daysUntil >= 0 ? `${daysUntil}d left` : `${Math.abs(daysUntil)}d over`})</span>
                )}
              </div>
            )}
            {!product.target_qty && !product.target_dispatch_date && (
              <p className="text-sm text-slate-400 italic">No targets set</p>
            )}
          </div>

        {/* Dispatch progress bar */}
        {dispatchPct !== null && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Dispatch progress</span>
              <span className={`font-semibold ${dispatchPct >= 100 ? 'text-green-600' : dispatchPct >= 60 ? 'text-sky-600' : 'text-slate-600'}`}>
                {totalDispatched.toLocaleString()} / {product.target_qty!.toLocaleString()} pcs ({dispatchPct}%)
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  dispatchPct >= 100 ? 'bg-green-500' : dispatchPct >= 60 ? 'bg-sky-500' : 'bg-blue-400'
                }`}
                style={{ width: `${dispatchPct}%` }}
              />
            </div>
          </div>
        )}

        </BentoCard>

        {/* Stage progress bar */}
        <BentoCard className="col-span-full pb-8">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-6">Production Pipeline Stage</h3>
          <div className="flex items-center">
            {PRODUCT_STAGES.map((stage, i) => {
              const done = i < stageIdx
              const current = i === stageIdx
              return (
                <div key={stage} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center min-w-0">
                    {done
                      ? <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0" />
                      : current
                      ? <div className="h-6 w-6 rounded-full border-2 border-blue-500 bg-blue-100 animate-pulse shrink-0" />
                      : <Circle className="h-6 w-6 text-slate-300 shrink-0" />
                    }
                    <span className={`text-[10px] mt-1 font-medium text-center ${current ? 'text-blue-600' : done ? 'text-green-600' : 'text-slate-400'}`}>
                      {stage}
                    </span>
                  </div>
                  {i < PRODUCT_STAGES.length - 1 && (
                    <div className={`h-1 flex-1 mx-2 mb-4 rounded-full ${done ? 'bg-green-400' : 'bg-slate-100'}`} />
                  )}
                </div>
              )
            })}
          </div>
        </BentoCard>
      </BentoGrid>

      {/* Stage tabs — numbered steps */}
      <BentoCard noPadding className="bg-slate-50/50">
        <div className="p-6">
          <div className="mb-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Production Steps</p>
            <p className="text-xs text-slate-500">Follow the steps in order. The current stage is highlighted. Fill in the details for the active step, then move on.</p>
          </div>
          <Tabs defaultValue={currentStage.toLowerCase() === 'dispatched' ? 'dispatch' : currentStage.toLowerCase()}>
            <TabsList className="w-full justify-start overflow-x-auto bg-white border shadow-sm gap-0 p-0 h-auto rounded-lg">
              {([
                { value: 'cutting',  label: 'Cutting',  step: 1, stage: 'Cutting' },
                { value: 'printing', label: 'Printing', step: 2, stage: 'Printing' },
                { value: 'sewing',   label: 'Sewing',   step: 3, stage: 'Sewing' },
                { value: 'qc',       label: 'QC Check', step: 4, stage: 'QC' },
                { value: 'finishing',label: 'Finishing', step: 5, stage: 'Finishing' },
                { value: 'dispatch', label: 'Dispatch', step: 6, stage: 'Dispatched' },
                { value: 'stock',    label: 'Stock',    step: 7, stage: null },
              ] as const).map(({ value, label, step, stage }) => {
                const isCurrent = stage ? currentStage === stage : false
                const isDone = stage ? PRODUCT_STAGES.indexOf(currentStage) > PRODUCT_STAGES.indexOf(stage as ProductStage) : false
                return (
                  <TabsTrigger
                    key={value}
                    value={value}
                    className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-none first:rounded-l-lg last:rounded-r-lg border-r last:border-r-0 border-slate-100 min-w-[70px] text-center data-[state=active]:shadow-none data-[state=active]:bg-blue-50 ${isCurrent ? 'data-[state=active]:bg-blue-50' : ''}`}
                  >
                    <span className={`text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center ${
                      isDone ? 'bg-green-500 text-white' :
                      isCurrent ? 'bg-blue-600 text-white animate-pulse' :
                      'bg-slate-200 text-slate-500'
                    }`}>{isDone ? '✓' : step}</span>
                    <span className={`text-[11px] font-medium ${isCurrent ? 'text-blue-700' : isDone ? 'text-green-700' : 'text-slate-500'}`}>{label}</span>
                  </TabsTrigger>
                )
              })}
            </TabsList>

            <div className="bg-white rounded-xl border shadow-sm mt-4">
              <TabsContent value="cutting" className="m-0">
                <div className="px-5 pt-4 pb-1 border-b border-slate-100">
                  <p className="text-xs text-slate-500">Enter the fabric cutting details — color names, quantities per color, start date, and total weight. This is the <strong>first step</strong> in production.</p>
                </div>
                <CuttingTab productId={product.id} onStageChange={setCurrentStage} />
              </TabsContent>
              <TabsContent value="printing" className="m-0">
                <div className="px-5 pt-4 pb-1 border-b border-slate-100">
                  <p className="text-xs text-slate-500">Record the printing or embroidery vendor, how many pieces were sent out, and how many came back. <strong>Quantities marked auto-synced are filled automatically</strong> from your daily entries.</p>
                </div>
                <PrintingTab productId={product.id} onStageChange={setCurrentStage} hasLinkedEntries={dailyActivity.length > 0} />
              </TabsContent>
              <TabsContent value="sewing" className="m-0">
                <div className="px-5 pt-4 pb-1 border-b border-slate-100">
                  <p className="text-xs text-slate-500">Track the sewing vendor, sending date, and how many pieces went out vs came back. Short quantity means pieces that didn&apos;t return.</p>
                </div>
                <SewingTab productId={product.id} onStageChange={setCurrentStage} hasLinkedEntries={dailyActivity.length > 0} />
              </TabsContent>
              <TabsContent value="qc" className="m-0">
                <div className="px-5 pt-4 pb-1 border-b border-slate-100">
                  <p className="text-xs text-slate-500">Record quality check results — how many pieces passed, were rejected, or need alteration. Only <strong>passed</strong> pieces move to Finishing.</p>
                </div>
                <QCTab productId={product.id} onStageChange={setCurrentStage} hasLinkedEntries={dailyActivity.length > 0} />
              </TabsContent>
              <TabsContent value="finishing" className="m-0">
                <div className="px-5 pt-4 pb-1 border-b border-slate-100">
                  <p className="text-xs text-slate-500">Track pieces through ironing, folding, and final packing. Once all pieces are <strong>Dispatch Ready</strong>, the product is ready to be sent to branches.</p>
                </div>
                <FinishingTab productId={product.id} onStageChange={setCurrentStage} hasLinkedEntries={dailyActivity.length > 0} />
              </TabsContent>
              <TabsContent value="dispatch" className="m-0">
                <div className="px-5 pt-4 pb-1 border-b border-slate-100">
                  <p className="text-xs text-slate-500">Enter how many pieces were sent to each branch and on which date. You can record up to 3 separate dispatch batches per branch.</p>
                </div>
                <DispatchTab productId={product.id} onTotalChange={setTotalDispatched} />
              </TabsContent>
              <TabsContent value="stock" className="m-0">
                <div className="px-5 pt-4 pb-1 border-b border-slate-100">
                  <p className="text-xs text-slate-500">Record any remaining unsold pieces by color. Stock is what stays in the warehouse after dispatch.</p>
                </div>
                <StockTab productId={product.id} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </BentoCard>

      {/* Daily production activity — below stage tabs */}
      <BentoCard noPadding>
        <div className="p-6 pb-0">
          <h3 className="text-sm font-semibold text-slate-700 mb-1">Daily Activity Log</h3>
          <p className="text-xs text-slate-400 mb-4">All daily entry sheet records linked to this product — automatically collected from the Daily Entry Sheet.</p>
        </div>
        <ProductActivityPanel rows={dailyActivity} />
      </BentoCard>
    </div>
  )
}
