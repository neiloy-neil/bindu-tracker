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
import { Plus, Search } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { BentoCard } from '@/components/shared/BentoCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { PackageOpen } from 'lucide-react'
import type { ProductSummaryRow, ProductStage } from '@/types/app'
import { PRODUCT_STAGES } from '@/constants'
import { formatDate } from '@/lib/utils/formatters'

const STAGE_COLORS: Record<ProductStage, string> = {
  Cutting:    'bg-blue-100 text-blue-700',
  Printing:   'bg-teal-100 text-teal-700',
  Sewing:     'bg-orange-100 text-orange-700',
  QC:         'bg-green-100 text-green-700',
  Finishing:  'bg-purple-100 text-purple-700',
  Dispatched: 'bg-sky-100 text-sky-700',
  Completed:  'bg-slate-100 text-slate-600',
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

  const th = 'px-3 py-2 text-left text-xs font-semibold text-slate-600 whitespace-nowrap'
  const td = 'px-3 py-2 text-sm text-slate-700 whitespace-nowrap'

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-2.5 top-2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search code or name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm w-52"
          />
        </div>
        {!fixedStage && (
          <Select value={stageFilter} onValueChange={(v) => handleStageChange(v ?? 'all')}>
            <SelectTrigger className="h-8 text-sm w-36">
              <SelectValue placeholder="All Stages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              {PRODUCT_STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <Link href="/dashboard/products/new" className="ml-auto">
          <Button size="sm" className="bg-[#1A3557] hover:bg-[#142a45]">
            <Plus className="h-4 w-4 mr-1" /> New Product
          </Button>
        </Link>
      </div>

      <BentoCard noPadding className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className={th + ' w-12'}>Image</th>
              <th className={th}>Code</th>
              <th className={th}>Name</th>
              <th className={th}>Stage</th>
              <th className={th + ' hidden md:table-cell'}>Start Date</th>
              <th className={th + ' hidden md:table-cell'}>Cutting</th>
              <th className={th + ' hidden lg:table-cell'}>Print</th>
              <th className={th + ' hidden lg:table-cell'}>Sew</th>
              <th className={th + ' hidden lg:table-cell'}>QC</th>
              <th className={th + ' hidden md:table-cell'}>Stock</th>
              <th className={th}></th>
            </tr>
          </thead>
          <AnimatePresence mode="wait">
            <motion.tbody
              key={stageFilter} // Remount to trigger animation when filter changes
              initial="hidden"
              animate="visible"
              variants={{
                visible: { transition: { staggerChildren: 0.03 } }
              }}
            >
              {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td colSpan={11} className="p-3"><Skeleton className="h-5 w-full" /></td>
                </tr>
              ))
              : filtered.length === 0
              ? (
                <tr>
                  <td colSpan={11} className="p-4">
                    <EmptyState
                      icon={PackageOpen}
                      title={search || stageFilter !== 'all' ? 'No products match filter' : 'No products yet'}
                      description={search || stageFilter !== 'all' 
                        ? 'Try adjusting your search query or stage filter.' 
                        : 'Your production pipeline is empty. Click "New Product" to add one.'}
                    />
                  </td>
                </tr>
              )
              : filtered.map((p) => (
                <motion.tr
                  key={p.id}
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    visible: { opacity: 1, y: 0 }
                  }}
                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <td className={td}>
                    {p.image_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={p.image_url} alt="" className="w-8 h-8 rounded object-cover shadow-sm border bg-white" />
                    ) : (
                      <div className="w-8 h-8 rounded bg-slate-50 border border-dashed border-slate-300 flex items-center justify-center text-[10px] text-slate-400">?</div>
                    )}
                  </td>
                  <td className={`${td} font-mono font-medium text-[#1A3557]`}>{p.product_code}</td>
                  <td className={td}>{p.product_name}</td>
                  <td className={td}>
                    <Badge className={`text-xs ${STAGE_COLORS[p.current_stage] ?? ''}`} variant="secondary">
                      {p.current_stage}
                    </Badge>
                  </td>
                  <td className={td + ' hidden md:table-cell'}>{formatDate(p.production_start_date)}</td>
                  <td className={td + ' hidden md:table-cell'}>{p.cutting_total_qty ?? '—'}</td>
                  <td className={td + ' hidden lg:table-cell'}>
                    {p.print_status
                      ? <Badge variant="secondary" className="text-xs">{p.print_status}</Badge>
                      : '—'}
                  </td>
                  <td className={td + ' hidden lg:table-cell'}>
                    {p.sew_status
                      ? <Badge variant="secondary" className="text-xs">{p.sew_status}</Badge>
                      : '—'}
                  </td>
                  <td className={td + ' hidden lg:table-cell'}>
                    {p.qc_status
                      ? <Badge variant="secondary" className="text-xs">{p.qc_status}</Badge>
                      : '—'}
                  </td>
                  <td className={td + ' hidden md:table-cell'}>{p.stock_total ?? '—'}</td>
                  <td className={td}>
                    <Link
                      href={`/dashboard/products/${p.id}`}
                      className="text-xs text-[#1A3557] hover:underline font-medium"
                    >
                      View →
                    </Link>
                  </td>
                </motion.tr>
              ))
            }
          </motion.tbody>
          </AnimatePresence>
        </table>
      </BentoCard>

      {!loading && (
        <p className="text-xs text-slate-400 text-right">
          {filtered.length} product{filtered.length !== 1 ? 's' : ''}
          {stageFilter !== 'all' && ` in ${stageFilter}`}
        </p>
      )}
    </div>
  )
}
