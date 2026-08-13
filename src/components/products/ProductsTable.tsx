'use client'
import { useState, useEffect } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Search, PackageOpen, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { EmptyState } from '@/components/shared/EmptyState'
import type { ProductSummaryRow, ProductStage } from '@/types/app'
import { PRODUCT_STAGES } from '@/constants'
import { formatDate } from '@/lib/utils/formatters'

const STAGE_COLORS: Record<ProductStage, string> = {
  Cutting:    'bg-blue-50 text-blue-700 border-blue-200/60',
  Printing:   'bg-teal-50 text-teal-700 border-teal-200/60',
  Sewing:     'bg-orange-50 text-orange-700 border-orange-200/60',
  QC:         'bg-green-50 text-green-700 border-green-200/60',
  Finishing:  'bg-purple-50 text-purple-700 border-purple-200/60',
  Dispatched: 'bg-sky-50 text-sky-700 border-sky-200/60',
  Completed:  'bg-slate-50 text-slate-600 border-slate-200/60',
}

export default function ProductsTable({ fixedStage }: { fixedStage?: ProductStage }) {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const [products, setProducts] = useState<ProductSummaryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState<string>(fixedStage ?? searchParams.get('stage') ?? 'all')

  // Sync stage filter from URL
  useEffect(() => {
    if (fixedStage) return
    const s = searchParams.get('stage')
    setStageFilter(s ?? 'all')
  }, [searchParams, fixedStage])

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase
        .from('product_summary')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) { toast.error('Failed to load products'); setLoading(false); return }
      setProducts(data ?? [])
      setLoading(false)
    }
    fetch()
  }, [supabase])

  const handleStageChange = (value: string) => {
    setStageFilter(value)
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all') params.delete('stage')
    else params.set('stage', value)
    router.push(`${pathname}?${params.toString()}`)
  }

  const filtered = products.filter(p => {
    const matchStage = stageFilter === 'all' || p.current_stage === stageFilter
    const matchSearch = search === '' ||
      p.product_code.toLowerCase().includes(search.toLowerCase()) ||
      p.product_name.toLowerCase().includes(search.toLowerCase())
    return matchStage && matchSearch
  })

  const th = 'px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap text-left sticky top-0 bg-slate-50/95 backdrop-blur-sm shadow-[0_1px_0_0_rgba(0,0,0,0.05)] z-10'
  const td = 'px-4 py-3 text-sm text-foreground whitespace-nowrap align-middle'

  return (
    <div className="space-y-4">
      {/* Products page specific header */}
      {!fixedStage && (
        <div className="flex items-start justify-between animate-fade-up">
          <div>
            <h2 className="text-2xl font-black text-foreground tracking-tight">Product Library</h2>
            <p className="text-sm font-medium text-muted-foreground mt-1">Manage all designs, view their status, and track inventory.</p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 flex-wrap bg-white/50 p-3 rounded-xl border border-border/50">
        <div className="relative group flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search code or name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm w-full bg-white border-border/80 shadow-sm transition-all focus:border-primary"
          />
        </div>
        {!fixedStage && (
          <Select value={stageFilter} onValueChange={(v) => handleStageChange(v ?? 'all')}>
            <SelectTrigger className="h-9 text-sm w-40 bg-white border-border/80 shadow-sm font-semibold">
              <SelectValue placeholder="All Stages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              {PRODUCT_STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <Link href="/dashboard/products/new" className="ml-auto">
          <Button size="sm" className="h-9 px-4 gap-2 font-bold shadow-sm hover:shadow hover:-translate-y-0.5 transition-all">
            <Plus className="h-4 w-4" /> New Product
          </Button>
        </Link>
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={stageFilter} // Remount to trigger animation when filter changes
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.05 } }
            }}
            className="flex flex-col gap-3"
          >
            {loading
            ? Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))
            : filtered.length === 0
            ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 shadow-sm">
                <EmptyState
                  icon={PackageOpen}
                  title={search || stageFilter !== 'all' ? 'No products match filter' : 'No products yet'}
                  description={search || stageFilter !== 'all' 
                    ? 'Try adjusting your search query or stage filter.' 
                    : 'Your production pipeline is empty. Click "New Product" to add one.'}
                />
              </div>
            )
            : filtered.map((p) => (
              <motion.div
                key={p.id}
                variants={{
                  hidden: { opacity: 0, y: 15 },
                  visible: { opacity: 1, y: 0 }
                }}
                className="group flex flex-col sm:flex-row bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer overflow-hidden relative"
                onClick={() => router.push(`/dashboard/products/${p.id}`)}
              >
                {/* Left: Image */}
                <div className="sm:w-32 h-32 sm:h-auto bg-slate-50 border-r border-slate-100 flex items-center justify-center shrink-0">
                  {p.image_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-slate-300">?</span>
                  )}
                </div>

                {/* Middle: Details */}
                <div className="flex-1 p-4 md:p-5 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-mono font-bold text-sm text-slate-900">{p.product_code}</span>
                    <Badge className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border shadow-sm ${STAGE_COLORS[p.current_stage] ?? ''}`} variant="outline">
                      {p.current_stage}
                    </Badge>
                  </div>
                  <h3 className="text-base font-semibold text-slate-700 truncate mb-3">{p.product_name}</h3>
                  
                  {/* Stats Row */}
                  <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500">
                    <div className="flex flex-col">
                      <span className="uppercase text-[10px] text-slate-400 mb-0.5">Start Date</span>
                      <span>{formatDate(p.production_start_date)}</span>
                    </div>
                    <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
                    <div className="flex flex-col">
                      <span className="uppercase text-[10px] text-slate-400 mb-0.5">Cut Qty</span>
                      <span className="text-slate-700 font-bold">{p.cutting_total_qty ?? '—'}</span>
                    </div>
                    <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
                    <div className="flex flex-col">
                      <span className="uppercase text-[10px] text-slate-400 mb-0.5">Stock</span>
                      <span className="text-slate-700 font-bold">{p.stock_total ?? '—'}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Quick Status & Action */}
                <div className="p-4 md:p-5 border-t sm:border-t-0 sm:border-l border-slate-100 bg-slate-50/50 flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 sm:w-48 shrink-0">
                  <div className="flex gap-2">
                    {p.print_status && <Badge variant="secondary" className="text-[10px] font-bold bg-white border-slate-200 text-slate-600 shadow-sm" title="Print Status">{p.print_status}</Badge>}
                    {p.sew_status && <Badge variant="secondary" className="text-[10px] font-bold bg-white border-slate-200 text-slate-600 shadow-sm" title="Sew Status">{p.sew_status}</Badge>}
                    {p.qc_status && <Badge variant="secondary" className="text-[10px] font-bold bg-white border-slate-200 text-slate-600 shadow-sm" title="QC Status">{p.qc_status}</Badge>}
                  </div>
                  <Link
                    href={`/dashboard/products/${p.id}`}
                    onClick={e => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wider font-bold text-slate-400 group-hover:text-primary transition-colors duration-200"
                  >
                    Open <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
              </motion.div>
            ))
          }
          </motion.div>
        </AnimatePresence>
      </div>

      {!loading && (
        <p className="text-xs font-bold text-slate-400 text-right tracking-wide uppercase">
          {filtered.length} product{filtered.length !== 1 ? 's' : ''}
          {stageFilter !== 'all' && ` in ${stageFilter}`}
        </p>
      )}
    </div>
  )
}
