import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import ProductsTable from '@/components/products/ProductsTable'

export default function CuttingPage() {
  return (
    <div className="space-y-5 max-w-7xl">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">Cutting Stage</h2>
        <p className="text-sm text-slate-500 mt-0.5">All products currently in the Cutting stage.</p>
      </div>
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <ProductsTable fixedStage="Cutting" />
      </Suspense>
    </div>
  )
}
