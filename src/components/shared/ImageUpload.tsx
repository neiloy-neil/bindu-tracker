'use client'
import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Loader2, X, Image as ImageIcon } from 'lucide-react'

interface ImageUploadProps {
  value: string | null | undefined
  onChange: (url: string | null) => void
  disabled?: boolean
}

export default function ImageUpload({ value, onChange, disabled }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Limit to 5MB
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }

    try {
      setUploading(true)
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, { upsert: false })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('product-images').getPublicUrl(filePath)
      onChange(data.publicUrl)
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error uploading image'
      toast.error(msg)
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const removeImage = () => {
    onChange(null)
  }

  return (
    <div className="space-y-4">
      {value ? (
        <div className="relative w-40 h-40 rounded-lg border shadow-sm overflow-hidden group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Product" className="w-full h-full object-cover" />
          {!disabled && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Button type="button" variant="destructive" size="sm" onClick={removeImage}>
                <X className="h-4 w-4 mr-1" /> Remove
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div 
          onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
          className={`w-40 h-40 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-slate-400 
            ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-50 hover:border-slate-300 hover:text-slate-500'} 
            transition-colors`}
        >
          {uploading ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin mb-2" />
              <span className="text-xs font-medium">Uploading...</span>
            </>
          ) : (
            <>
              <ImageIcon className="h-8 w-8 mb-2 opacity-50" />
              <span className="text-xs font-medium">Click to upload</span>
              <span className="text-[10px] opacity-70 mt-1">PNG, JPG up to 5MB</span>
            </>
          )}
        </div>
      )}
      
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/png, image/jpeg, image/webp"
        onChange={handleFileChange}
        disabled={disabled || uploading}
      />
    </div>
  )
}
