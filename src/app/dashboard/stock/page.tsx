import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import ProductsTable from '@/components/products/ProductsTable'

export default function StockPage() {
  return (
    <div className="space-y-5 max-w-7xl">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">Warehouse Stock</h2>
        <p className="text-sm text-slate-500 mt-0.5">Products that are completed or partially completed with warehouse stock.</p>
      </div>
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <ProductsTable fixedStage="Completed" />
      </Suspense>
    </div>
  )
}
