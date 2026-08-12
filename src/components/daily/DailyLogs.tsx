'use client'
import { useState, useEffect, useCallback } from 'react'
import { format, parseISO } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { BentoCard } from '@/components/shared/BentoCard'

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
  Cutting:   { dot: 'bg-blue-500',   badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  Printing:  { dot: 'bg-teal-500',   badge: 'bg-teal-50 text-teal-700 border-teal-200' },
  Sewing:    { dot: 'bg-orange-500', badge: 'bg-orange-50 text-orange-700 border-orange-200' },
  QC:        { dot: 'bg-green-500',  badge: 'bg-green-50 text-green-700 border-green-200' },
  Finishing: { dot: 'bg-purple-500', badge: 'bg-purple-50 text-purple-700 border-purple-200' },
  Dispatch:  { dot: 'bg-sky-500',    badge: 'bg-sky-50 text-sky-700 border-sky-200' },
  Stage:     { dot: 'bg-slate-500',  badge: 'bg-slate-100 text-slate-600 border-slate-200' },
}

const DEFAULT_STYLE = { dot: 'bg-slate-400', badge: 'bg-slate-50 text-slate-600 border-slate-200' }

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
    <div className="space-y-4">
      {/* Date controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => changeDate(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="border rounded px-3 py-1 text-sm font-medium" />
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => changeDate(1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        {date !== today && (
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setDate(today)}>
            Today
          </Button>
        )}
        <span className="text-sm text-slate-500">{format(parseISO(date), 'EEEE, dd MMM yyyy')}</span>
        <span className="ml-auto text-xs text-slate-400">{entries.length} event{entries.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Log feed */}
      <BentoCard noPadding>
        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : entries.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <p className="text-sm text-slate-400">No activity logged on this day.</p>
            <p className="text-xs text-slate-300">Updates made in the{' '}
              <Link href="/dashboard/products" className="text-blue-500 hover:underline">Product Tracker</Link>
              {' '}appear here automatically.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {entries.map(e => {
              const style = ACTION_STYLES[e.action] ?? DEFAULT_STYLE
              const time = format(new Date(e.created_at), 'HH:mm')
              return (
                <div key={e.id} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                  {/* Time */}
                  <span className="text-xs text-slate-400 font-mono w-10 shrink-0 pt-0.5">{time}</span>

                  {/* Dot */}
                  <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${style.dot}`} />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/dashboard/products/${e.product_id}`}
                        className="text-xs font-semibold text-blue-700 hover:underline"
                      >
                        {e.product_code}
                      </Link>
                      <span className="text-xs text-slate-500 truncate">{e.product_name}</span>
                      <span className={`ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded border ${style.badge}`}>
                        {e.action}
                      </span>
                    </div>
                    {e.details && (
                      <p className="text-xs text-slate-500 mt-0.5">{e.details}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </BentoCard>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-slate-400">
        {Object.entries(ACTION_STYLES).map(([action, s]) => (
          <span key={action} className="flex items-center gap-1">
            <span className={`h-2 w-2 rounded-full ${s.dot}`} />
            {action}
          </span>
        ))}
      </div>
    </div>
  )
}
