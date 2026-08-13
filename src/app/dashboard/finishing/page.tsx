import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import ProductsTable from '@/components/products/ProductsTable'

export default function FinishingPage() {
  return (
    <div className="space-y-5 max-w-7xl">
      <div>
        <h2 className="text-base font-bold text-slate-800 tracking-tight">Finishing Stage</h2>
        <p className="text-xs text-slate-400 mt-0.5">All products currently in the Finishing stage.</p>
      </div>
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <ProductsTable fixedStage="Finishing" />
      </Suspense>
    </div>
  )
}
