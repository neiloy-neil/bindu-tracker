import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import ProductsTable from '@/components/products/ProductsTable'

export default function StockPage() {
  return (
    <div className="space-y-6 max-w-7xl animate-fade-up">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-black text-foreground tracking-tight">Warehouse Stock</h2>
          <p className="text-sm font-medium text-muted-foreground mt-1">Products that are completed or partially completed with warehouse stock.</p>
        </div>
      </div>
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <ProductsTable fixedStage="Completed" />
      </Suspense>
    </div>
  )
}
