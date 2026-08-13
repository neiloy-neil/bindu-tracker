'use client'
import { useState, useEffect, useCallback } from 'react'
import { format, parseISO } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronLeft, ChevronRight, Activity } from 'lucide-react'
import Link from 'next/link'

type LogEntry = {
  id: string
  product_id: string
  product_code: string
  product_name: string
  action: string
  details: string | null
  created_at: string
}

const ACTION_STYLES: Record<string, { dot: string; badge: string }> = {
  Cutting:   { dot: 'bg-blue-500 shadow-blue-500/40',   badge: 'bg-blue-50 text-blue-700 border-blue-200/60' },
  Printing:  { dot: 'bg-teal-500 shadow-teal-500/40',   badge: 'bg-teal-50 text-teal-700 border-teal-200/60' },
  Sewing:    { dot: 'bg-orange-500 shadow-orange-500/40', badge: 'bg-orange-50 text-orange-700 border-orange-200/60' },
  QC:        { dot: 'bg-green-500 shadow-green-500/40',  badge: 'bg-green-50 text-green-700 border-green-200/60' },
  Finishing: { dot: 'bg-purple-500 shadow-purple-500/40', badge: 'bg-purple-50 text-purple-700 border-purple-200/60' },
  Dispatch:  { dot: 'bg-sky-500 shadow-sky-500/40',    badge: 'bg-sky-50 text-sky-700 border-sky-200/60' },
  Stage:     { dot: 'bg-slate-500 shadow-slate-500/40',  badge: 'bg-slate-100 text-slate-600 border-slate-200/60' },
}

const DEFAULT_STYLE = { dot: 'bg-slate-400', badge: 'bg-slate-50 text-slate-600 border-slate-200/60' }

export default function DailyLogs() {
  const supabase = createClient()
  const today = format(new Date(), 'yyyy-MM-dd')
  const [date, setDate] = useState(today)
  const [entries, setEntries] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLogs = useCallback(async (d: string) => {
    setLoading(true)
    const off = -new Date().getTimezoneOffset()
    const h = String(Math.floor(Math.abs(off) / 60)).padStart(2, '0')
    const m = String(Math.abs(off) % 60).padStart(2, '0')
    const tz = (off >= 0 ? '+' : '-') + h + ':' + m
    const start = `${d}T00:00:00${tz}`
    const end   = `${d}T23:59:59${tz}`
    const { data, error } = await supabase
      .from('product_activity_log')
      .select('id, product_id, product_code, product_name, action, details, created_at')
      .gte('created_at', start)
      .lte('created_at', end)
      .order('created_at', { ascending: false })
    if (!error) setEntries(data ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchLogs(date) }, [date, fetchLogs])

  const changeDate = (delta: number) => {
    const d = parseISO(date)
    d.setDate(d.getDate() + delta)
    setDate(format(d, 'yyyy-MM-dd'))
  }

  return (
    <div className="space-y-6">
      {/* Date controls */}
      <div className="bg-white/50 backdrop-blur-sm rounded-xl border border-border/60 shadow-sm p-4 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1 bg-white border border-border/80 rounded-lg p-1 shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-md transition-colors" onClick={() => changeDate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="border-none bg-transparent px-3 py-1.5 text-sm font-bold font-mono text-foreground focus:outline-none focus:ring-0 min-w-[140px] text-center" />
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-md transition-colors" onClick={() => changeDate(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="h-6 w-px bg-border/60 hidden sm:block" />
        
        <span className="text-sm font-black text-foreground">{format(parseISO(date), 'EEEE, dd MMM yyyy')}</span>
        
        {date !== today && (
          <Button variant="outline" size="sm" className="h-7 text-xs font-bold px-3 ml-2 bg-white shadow-sm" onClick={() => setDate(today)}>
            Today
          </Button>
        )}
        
        <div className="ml-auto flex items-center gap-2 bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/10">
          <Activity className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold text-primary tabular-nums tracking-wider uppercase">{entries.length} event{entries.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Log feed */}
      <div className="bg-white rounded-xl border border-border/80 shadow-sm overflow-hidden relative">
        <div className="absolute left-[88px] top-4 bottom-4 w-px bg-slate-100 z-0 hidden sm:block" />
        
        {loading ? (
          <div className="p-6 space-y-6 relative z-10">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-5 w-12 hidden sm:block" />
                <Skeleton className="h-16 w-full max-w-2xl rounded-xl" />
              </div>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="py-24 text-center space-y-4 relative z-10 flex flex-col items-center justify-center">
            <div className="h-16 w-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex items-center justify-center mb-2">
              <Activity className="h-8 w-8 text-slate-300" />
            </div>
            <p className="text-base font-bold text-slate-500">No activity logged on this day.</p>
            <p className="text-sm text-slate-400 font-medium">Updates made in the{' '}
              <Link href="/dashboard/products" className="text-primary hover:underline font-bold">Product Tracker</Link>
              {' '}appear here automatically.
            </p>
          </div>
        ) : (
          <div className="relative z-10 py-4">
            {entries.map((e, index) => {
              const style = ACTION_STYLES[e.action] ?? DEFAULT_STYLE
              const time = format(new Date(e.created_at), 'HH:mm')
              return (
                <div key={e.id} className="group flex items-start gap-4 px-6 py-4 hover:bg-slate-50/80 transition-colors relative">
                  {/* Timeline Time */}
                  <span className="text-[12px] font-bold text-slate-400 font-mono w-12 shrink-0 pt-1 tabular-nums hidden sm:block group-hover:text-slate-600 transition-colors text-right">
                    {time}
                  </span>
                  
                  {/* Timeline Dot */}
                  <div className="relative mt-2 shrink-0 hidden sm:flex items-center justify-center">
                    <div className="absolute inset-0 bg-white" />
                    <span className={`relative h-2.5 w-2.5 rounded-full shadow-sm z-10 transition-transform group-hover:scale-125 duration-300 ${style.dot}`} />
                  </div>
                  
                  {/* Log Content Card */}
                  <div className="flex-1 min-w-0 bg-white border border-border/40 shadow-[0_1px_3px_rgba(0,0,0,0.02)] rounded-xl p-4 group-hover:border-border group-hover:shadow-md transition-all duration-300">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="sm:hidden text-[11px] font-bold text-slate-400 font-mono tabular-nums">{time}</span>
                      
                      <Link
                        href={`/dashboard/products/${e.product_id}`}
                        className="text-xs font-black text-foreground hover:text-primary transition-colors font-mono tracking-tight bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100"
                      >
                        {e.product_code}
                      </Link>
                      
                      <span className="text-sm font-medium text-slate-600 truncate max-w-[200px] md:max-w-md">{e.product_name}</span>
                      
                      <span className={`ml-auto text-[10px] font-bold px-2 py-1 rounded-md border uppercase tracking-wider ${style.badge}`}>
                        {e.action}
                      </span>
                    </div>
                    {e.details && (
                      <p className="text-sm text-slate-500 mt-2.5 font-medium leading-snug pl-1 border-l-2 border-slate-100 group-hover:border-slate-200 transition-colors">{e.details}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 px-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Legend:</span>
        {Object.entries(ACTION_STYLES).map(([action, s]) => (
          <span key={action} className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <span className={`h-2 w-2 rounded-full ${s.dot}`} />
            {action}
          </span>
        ))}
      </div>
    </div>
  )
}
