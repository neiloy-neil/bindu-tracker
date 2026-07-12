import ProductForm from '@/components/products/ProductForm'

export default function NewProductPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-xl font-bold text-slate-800">New Product</h2>
      <ProductForm />
    </div>
  )
}
