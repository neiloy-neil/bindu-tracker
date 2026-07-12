'use client'
import { usePathname } from 'next/navigation'

const titles: Record<string, string> = {
  '/dashboard':          'Dashboard',
  '/dashboard/daily':    'Daily Entry Sheet',
  '/dashboard/products': 'Products',
  '/dashboard/pipeline': 'Active Pipeline',
  '/dashboard/reports':  'Reports',
}

import BranchSelector from '@/components/shared/BranchSelector'

export default function TopNav() {
  const pathname = usePathname()
  const title = Object.entries(titles)
    .filter(([k]) => pathname.startsWith(k))
    .sort((a, b) => b[0].length - a[0].length)[0]?.[1] ?? 'Bindu Tracker'

  return (
    <header className="h-14 border-b bg-white flex items-center justify-between px-6 shrink-0 mt-12 md:mt-0">
      <h1 className="font-semibold text-slate-800 text-sm">{title}</h1>
      <BranchSelector />
    </header>
  )
}
