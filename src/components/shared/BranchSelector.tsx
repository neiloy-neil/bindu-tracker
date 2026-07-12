'use client'
import { useEffect, useState } from 'react'
import { useBranchStore } from '@/lib/store/useBranchStore'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BRANCHES } from '@/constants'
import { Store } from 'lucide-react'

export default function BranchSelector() {
  const { selectedBranch, setSelectedBranch } = useBranchStore()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="w-[180px] h-9 bg-slate-100 animate-pulse rounded-md" />

  return (
    <Select value={selectedBranch ?? 'all'} onValueChange={(v) => setSelectedBranch(v === 'all' ? null : v)}>
      <SelectTrigger className="w-[180px] h-9 text-sm bg-slate-50">
        <div className="flex items-center gap-2">
          <Store className="h-4 w-4 text-slate-500" />
          <SelectValue placeholder="All Branches" />
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all" className="font-medium">All Branches</SelectItem>
        {BRANCHES.map(branch => (
          <SelectItem key={branch} value={branch}>{branch}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
