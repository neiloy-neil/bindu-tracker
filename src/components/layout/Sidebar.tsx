'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, ClipboardList, Package, BarChart3, GitBranch, LogOut, Menu, X, Users
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

const nav = [
  { href: '/dashboard',          label: 'Dashboard',    icon: LayoutDashboard, req: ['Admin', 'Manager', 'Viewer'] },
  { href: '/dashboard/daily',    label: 'Daily Entry',  icon: ClipboardList,   req: ['Admin', 'Manager'] },
  { href: '/dashboard/products', label: 'Products',     icon: Package,         req: ['Admin', 'Manager', 'Viewer'] },
  { href: '/dashboard/pipeline', label: 'Pipeline',     icon: GitBranch,       req: ['Admin', 'Manager', 'Viewer'] },
  { href: '/dashboard/reports',  label: 'Reports',      icon: BarChart3,       req: ['Admin', 'Manager'] },
  { href: '/dashboard/vendors',  label: 'Vendors',      icon: Users,           req: ['Admin'] },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [role, setRole] = useState<string>('Admin') // Default to Admin for this MVP if undefined

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

  const navLinks = (
    <nav className="flex-1 px-3 py-4 space-y-1">
      {nav.filter(n => n.req.includes(role)).map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              active
                ? 'bg-white/15 text-white'
                : 'text-white/60 hover:bg-white/10 hover:text-white'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        )
      })}
    </nav>
  )

  const logo = (
    <div className="px-5 py-6 border-b border-white/10">
      <div className="font-bold text-lg leading-tight">Bindu Premium</div>
      <div className="text-xs text-white/50 mt-0.5">Production Tracker</div>
    </div>
  )

  const logoutBtn = (
    <div className="px-3 py-4 border-t border-white/10">
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-white/60 hover:bg-white/10 hover:text-white w-full transition-colors"
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </button>
    </div>
  )

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[#1A3557] text-white flex items-center justify-between px-4 py-3 shadow-md">
        <div className="font-bold text-sm">Bindu Premium</div>
        <button onClick={() => setOpen(!open)} className="text-white/80 hover:text-white">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile drawer overlay */}
      {open && (
        <div className="md:hidden fixed inset-0 z-30 bg-black/40" onClick={() => setOpen(false)} />
      )}

      {/* Mobile drawer */}
      <aside className={cn(
        'md:hidden fixed top-0 left-0 z-40 flex flex-col w-56 h-full bg-[#1A3557] text-white shadow-xl transition-transform duration-200',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="pt-14">{logo}{navLinks}{logoutBtn}</div>
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 min-h-screen bg-[#1A3557] text-white shrink-0">
        {logo}{navLinks}{logoutBtn}
      </aside>
    </>
  )
}
