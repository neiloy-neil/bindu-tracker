'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, ClipboardList, Package, BarChart3,
  Activity, LogOut, Menu, X, Users, Search
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

const navGroups = [
  {
    label: null,
    items: [
      { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, req: ['Admin', 'Manager', 'Viewer'] },
    ],
  },
  {
    label: 'Production Control',
    items: [
      { href: '/dashboard/pipeline', label: 'Pipeline',   icon: Activity,      req: ['Admin', 'Manager', 'Viewer'] },
      { href: '/dashboard/daily',    label: 'Daily Logs', icon: ClipboardList, req: ['Admin', 'Manager'] },
    ],
  },
  {
    label: 'Data & Settings',
    items: [
      { href: '/dashboard/products', label: 'Products', icon: Package,  req: ['Admin', 'Manager', 'Viewer'] },
      { href: '/dashboard/reports',  label: 'Reports',  icon: BarChart3, req: ['Admin', 'Manager'] },
      { href: '/dashboard/vendors',  label: 'Vendors',  icon: Users,    req: ['Admin'] },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [role, setRole] = useState<string>('Admin')

  useEffect(() => {
    supabase.rpc('get_my_role').then(({ data }) => {
      if (data) setRole(data)
    })
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const NavLink = ({ href, label, icon: Icon }: { href: string; label: string; icon: typeof LayoutDashboard }) => {
    const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
    return (
      <Link
        href={href}
        onClick={() => setOpen(false)}
        className={cn(
          'group flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 relative overflow-hidden',
          active
            ? 'text-white bg-white/10 shadow-sm'
            : 'text-white/60 hover:text-white hover:bg-white/5'
        )}
      >
        {active && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-light rounded-r-md animate-fade-in" />
        )}
        <Icon className={cn(
          "h-4 w-4 shrink-0 transition-transform duration-200",
          active ? "text-brand-light" : "group-hover:scale-110"
        )} />
        {label}
      </Link>
    )
  }

  const navContent = (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8">
      {navGroups.map((group, gi) => {
        const visible = group.items.filter(item => item.req.includes(role))
        if (!visible.length) return null
        return (
          <div key={gi}>
            {group.label && (
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-3 px-1">
                {group.label}
              </p>
            )}
            <div className="space-y-1">
              {visible.map(item => (
                <NavLink key={item.href} href={item.href} label={item.label} icon={item.icon} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )

  const logo = (
    <div className="px-5 py-6 shrink-0 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-light to-blue-600 flex items-center justify-center shrink-0 shadow-sm">
          <span className="text-white text-[13px] font-black leading-none tracking-tighter">BT</span>
        </div>
        <div>
          <div className="font-bold text-sm leading-tight text-white tracking-tight">Bindu Tracker</div>
          <div className="text-[11px] font-medium text-white/50 tracking-wide">Production</div>
        </div>
      </div>
    </div>
  )

  const searchBox = (
    <div className="px-4 pb-4 shrink-0">
      <div className="relative group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 group-focus-within:text-brand-light transition-colors" />
        <input 
          type="text" 
          placeholder="Command (Ctrl+K)" 
          className="w-full bg-black/20 border border-white/10 rounded-md py-1.5 pl-9 pr-3 text-xs text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-brand-light transition-all"
        />
      </div>
    </div>
  )

  const logoutBtn = (
    <div className="p-4 shrink-0">
      <button
        onClick={handleLogout}
        className="group flex items-center justify-center gap-2 w-full px-4 py-2 rounded-md text-sm font-medium text-white/50 hover:text-white hover:bg-white/5 transition-all duration-200 border border-transparent hover:border-white/10"
      >
        <LogOut className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        Sign Out
      </button>
    </div>
  )

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-brand text-white flex items-center justify-between px-4 h-14 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-brand-light to-blue-600 flex items-center justify-center">
            <span className="text-white text-[10px] font-black leading-none">BT</span>
          </div>
          <div className="font-bold text-sm tracking-tight">Bindu Tracker</div>
        </div>
        <button onClick={() => setOpen(!open)} className="text-white/70 hover:text-white transition-colors p-2 -mr-2 rounded-md hover:bg-white/10">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div className="md:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm transition-opacity animate-fade-in" onClick={() => setOpen(false)} />
      )}

      {/* Mobile drawer */}
      <aside className={cn(
        'md:hidden fixed top-0 left-0 z-40 flex flex-col w-[260px] h-full bg-brand text-white shadow-2xl transition-transform duration-300 ease-out',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="pt-14 flex flex-col h-full bg-gradient-to-b from-white/5 to-transparent">
          {logo}
          {searchBox}
          {navContent}
          {logoutBtn}
        </div>
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-[260px] min-h-screen bg-brand text-white shrink-0 border-r border-brand-mid/50 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col h-full">
          {logo}
          {searchBox}
          {navContent}
          {logoutBtn}
        </div>
      </aside>
    </>
  )
}
