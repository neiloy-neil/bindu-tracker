'use client'
import { usePathname } from 'next/navigation'
import { LogOut } from 'lucide-react'

const titles: Record<string, string> = {
  '/dashboard':          'Dashboard Overview',
  '/dashboard/daily':    'Daily Production Logs',
  '/dashboard/products': 'Product Library',
  '/dashboard/pipeline': 'Production Pipeline',
  '/dashboard/reports':  'Analytics & Reports',
  '/dashboard/vendors':  'Vendor Management',
}

export default function TopNav() {
  const pathname = usePathname()
  const title = Object.entries(titles)
    .filter(([k]) => pathname.startsWith(k))
    .sort((a, b) => b[0].length - a[0].length)[0]?.[1] ?? 'Bindu Tracker'

  return (
    <header className="h-16 border-b border-border/50 bg-white/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0 mt-14 md:mt-0 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <h1 className="text-base font-bold text-foreground tracking-tight">{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        <button className="flex items-center gap-2 p-2 rounded-md hover:bg-slate-100 transition-colors text-slate-500 hover:text-red-600" title="Logout">
          <LogOut className="h-4 w-4" />
          <span className="text-xs font-bold hidden md:block">LOGOUT</span>
        </button>
      </div>
    </header>
  )
}
