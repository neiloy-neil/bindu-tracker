'use client'
import { useState, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'

interface VendorSelectProps {
  value: string | null
  onChange: (val: string | null) => void
  type: 'printing' | 'sewing'
  className?: string
}

export default function VendorSelect({ value, onChange, type, className }: VendorSelectProps) {
  const [vendors, setVendors] = useState<{name: string}[]>([])
  const supabase = createClient()

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('vendors')
        .select('name')
        .in('type', [type, 'both'])
        .eq('active', true)
        .order('name')
      setVendors(data ?? [])
    }
    fetch()
  }, [type, supabase])

  return (
    <Select value={value ?? 'none'} onValueChange={(v) => onChange(v === 'none' ? null : v)}>
      <SelectTrigger className={className || "w-full text-sm h-9 bg-white"}>
        <SelectValue placeholder="Select vendor" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none" className="text-slate-400 italic">No vendor</SelectItem>
        {vendors.map(v => (
          <SelectItem key={v.name} value={v.name}>{v.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
