import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import ProductsTable from '@/components/products/ProductsTable'

export default function ProductsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <ProductsTable />
    </Suspense>
  )
}
