'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Edit2, Loader2, Save, X, Users } from 'lucide-react'
import { BentoCard } from '@/components/shared/BentoCard'
import { EmptyState } from '@/components/shared/EmptyState'
import type { Vendor, VendorType } from '@/types/app'

export default function VendorsTable() {
  const supabase = createClient()
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)

  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [formData, setFormData] = useState<{name: string, type: VendorType, active: boolean}>({
    name: '', type: 'both', active: true
  })
  const [saving, setSaving] = useState(false)

  const fetchVendors = useCallback(async () => {
    const { data, error } = await supabase.from('vendors').select('*').eq('is_deleted', false).order('name')
    if (error) { toast.error('Failed to fetch vendors') }
    else { setVendors(data ?? []) }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchVendors()
  }, [fetchVendors])

  const startEdit = (v: Vendor) => {
    setEditingId(v.id)
    setFormData({ name: v.name, type: v.type, active: v.active })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setIsAdding(false)
    setFormData({ name: '', type: 'both', active: true })
  }

  const handleSave = async () => {
    if (!formData.name.trim()) return toast.error('Name is required')
    setSaving(true)
    
    const promise = (async () => {
      if (isAdding) {
        const { error } = await supabase.from('vendors').insert([
          { name: formData.name.trim(), type: formData.type, active: formData.active }
        ])
        if (error) throw new Error(error.message)
      } else if (editingId) {
        const { error } = await supabase.from('vendors')
          .update({ name: formData.name.trim(), type: formData.type, active: formData.active })
          .eq('id', editingId)
        if (error) throw new Error(error.message)
      }
    })()

    toast.promise(promise, {
      loading: isAdding ? 'Adding vendor...' : 'Updating vendor...',
      success: () => {
        cancelEdit()
        fetchVendors()
        return isAdding ? 'Vendor added' : 'Vendor updated'
      },
      error: (err) => err.message,
      finally: () => setSaving(false)
    })
  }

  const th = 'px-4 py-3 text-left text-xs font-semibold text-slate-600 border-b'
  const td = 'px-4 py-3 text-sm text-slate-700 border-b'

  const EditorRow = () => (
    <tr className="bg-slate-50">
      <td className={td}>
        <Input 
          value={formData.name} 
          onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
          placeholder="Vendor name"
          className="h-8 text-sm"
          autoFocus
        />
      </td>
      <td className={td}>
        <Select value={formData.type} onValueChange={v => setFormData(f => ({ ...f, type: v as VendorType }))}>
          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="printing">Printing</SelectItem>
            <SelectItem value="sewing">Sewing</SelectItem>
            <SelectItem value="both">Both</SelectItem>
          </SelectContent>
        </Select>
      </td>
      <td className={td}>
        <Select value={formData.active ? 'yes' : 'no'} onValueChange={v => setFormData(f => ({ ...f, active: v === 'yes' }))}>
          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="yes">Active</SelectItem>
            <SelectItem value="no">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </td>
      <td className={td}>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave} disabled={saving} className="h-8 px-2 bg-green-600 hover:bg-green-700">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          </Button>
          <Button size="sm" variant="outline" onClick={cancelEdit} className="h-8 px-2">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  )

  return (
    <BentoCard noPadding className="overflow-x-auto">
      <div className="p-4 border-b flex justify-between items-center bg-white">
        <h3 className="font-medium text-slate-800">All Vendors</h3>
        {!isAdding && !editingId && (
          <Button size="sm" onClick={() => { setIsAdding(true); setFormData({ name: '', type: 'both', active: true }) }} className="bg-[#1A3557] hover:bg-[#142a45]">
            <Plus className="h-4 w-4 mr-1" /> Add Vendor
          </Button>
        )}
      </div>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50">
            <th className={th}>Vendor Name</th>
            <th className={th}>Type</th>
            <th className={th}>Status</th>
            <th className={th + ' w-24'}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {isAdding && <EditorRow />}
          {loading ? (
            <tr><td colSpan={4} className="p-8 text-center text-sm text-slate-400">Loading vendors...</td></tr>
          ) : vendors.length === 0 && !isAdding ? (
            <tr>
              <td colSpan={4} className="p-4">
                <EmptyState
                  icon={Users}
                  title="No vendors found"
                  description="Add a vendor to get started."
                />
              </td>
            </tr>
          ) : vendors.map(v => (
            editingId === v.id ? <EditorRow key={v.id} /> : (
            <tr key={v.id} className="hover:bg-slate-50/50">
              <td className={td + ' font-medium'}>{v.name}</td>
              <td className={td}>
                <Badge variant="outline" className="capitalize text-xs">{v.type}</Badge>
              </td>
              <td className={td}>
                <Badge variant={v.active ? 'secondary' : 'outline'} className={v.active ? 'bg-green-100 text-green-700' : 'text-slate-400'}>
                  {v.active ? 'Active' : 'Inactive'}
                </Badge>
              </td>
              <td className={td}>
                {!isAdding && !editingId && (
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => startEdit(v)}>
                    <Edit2 className="h-4 w-4 text-slate-500" />
                  </Button>
                )}
              </td>
            </tr>
            )
          ))}
        </tbody>
      </table>
    </BentoCard>
  )
}
