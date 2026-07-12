import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export type LoginFormData = z.infer<typeof loginSchema>

export const productSchema = z.object({
  product_code: z.string().min(3, 'Design code must be at least 3 characters'),
  product_name: z.string().min(2, 'Product name is required'),
  production_start_date: z.string().optional().nullable(),
  image_url: z.string().optional().nullable(),
  current_stage: z.enum(['Cutting', 'Printing', 'Sewing', 'QC', 'Finishing', 'Dispatched', 'Completed']),
  notes: z.string().optional().nullable(),
  target_qty: z.string().regex(/^\d*$/, 'Quantity must be a number').optional().nullable(),
  target_dispatch_date: z.string().optional().nullable(),
})

export type ProductFormData = z.infer<typeof productSchema>

export const vendorSchema = z.object({
  name: z.string().min(2, 'Vendor name must be at least 2 characters'),
  type: z.enum(['printing', 'sewing', 'both']),
  active: z.boolean().default(true),
})

export type VendorFormData = z.infer<typeof vendorSchema>
