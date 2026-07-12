'use client'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { PRODUCT_STAGES } from '@/constants'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { productSchema, type ProductFormData } from '@/lib/validations'
import ImageUpload from '@/components/shared/ImageUpload'
import { BentoCard } from '@/components/shared/BentoCard'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ProductForm({ initialData }: { initialData?: any }) {
  const router = useRouter()
  const supabase = createClient()
  
  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      product_code: initialData?.product_code || '',
      product_name: initialData?.product_name || '',
      image_url: initialData?.image_url || null,
      production_start_date: initialData?.production_start_date || '',
      current_stage: initialData?.current_stage || 'Cutting',
      notes: initialData?.notes || '',
      target_qty: initialData?.target_qty?.toString() || '',
      target_dispatch_date: initialData?.target_dispatch_date || '',
    }
  })

  const onSubmit = async (data: ProductFormData) => {
    const payload = {
      product_code: data.product_code.trim(),
      product_name: data.product_name.trim(),
      image_url: data.image_url || null,
      production_start_date: data.production_start_date || null,
      current_stage: data.current_stage,
      notes: data.notes || null,
      target_qty: data.target_qty ? parseInt(data.target_qty, 10) : null,
      target_dispatch_date: data.target_dispatch_date || null,
    }

    const promise = (async () => {
      if (initialData) {
        const { error } = await supabase.from('products').update(payload).eq('id', initialData.id)
        if (error) throw new Error(error.message)
        return initialData.id
      } else {
        const { data: res, error } = await supabase.from('products').insert(payload).select().single()
        if (error) throw new Error(error.message)
        return res.id
      }
    })()

    toast.promise(promise, {
      loading: initialData ? 'Updating product...' : 'Creating product...',
      success: (id) => {
        router.push(`/dashboard/products/${id}`)
        router.refresh()
        return initialData ? 'Product updated' : 'Product created'
      },
      error: (err) => err.message
    })
  }

  return (
    <BentoCard noPadding>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 p-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-shrink-0">
          <Label className="block mb-2">Product Image</Label>
          <Controller
            control={control}
            name="image_url"
            render={({ field }) => (
              <ImageUpload value={field.value} onChange={field.onChange} disabled={isSubmitting} />
            )}
          />
        </div>
        
        <div className="flex-1 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="code">Design Code *</Label>
              <Input
                id="code"
                placeholder="e.g. design-198"
                {...register('product_code')}
                className={errors.product_code ? 'border-red-500' : ''}
              />
              {errors.product_code && <p className="text-red-500 text-xs">{errors.product_code.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                placeholder="e.g. Stripe Polo Shirt"
                {...register('product_name')}
                className={errors.product_name ? 'border-red-500' : ''}
              />
              {errors.product_name && <p className="text-red-500 text-xs">{errors.product_name.message}</p>}
            </div>
          </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="startDate">Production Start Date</Label>
          <Input
            id="startDate"
            type="date"
            {...register('production_start_date')}
          />
        </div>
        <div className="space-y-1">
          <Label>Current Stage</Label>
          <Controller
            control={control}
            name="current_stage"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_STAGES.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="targetQty">Target Quantity</Label>
          <Input
            id="targetQty" placeholder="e.g. 500"
            {...register('target_qty')}
            className={errors.target_qty ? 'border-red-500' : ''}
          />
          {errors.target_qty && <p className="text-red-500 text-xs">{errors.target_qty.message}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="dispatchDate">Target Dispatch Date</Label>
          <Input
            id="dispatchDate" type="date"
            {...register('target_dispatch_date')}
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="notes">Notes</Label>
        <Input
          id="notes"
          placeholder="Any additional notes…"
          {...register('notes')}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" className="bg-[#1A3557] hover:bg-[#142a45]" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? 'Update Product' : 'Create Product'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
        </div>
        </div>
      </form>
    </BentoCard>
  )
}
