'use client'
import { useState, useEffect, useCallback } from 'react'
import { format, parseISO } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Trash2, ChevronLeft, ChevronRight, Store } from 'lucide-react'
import type { ProductionEntry } from '@/types/app'
import { getCutTotal } from '@/lib/utils/calculations'
import { MAX_DAILY_ENTRIES } from '@/constants'
import DesignCodeInput from './DesignCodeInput'
import VendorSelect from '@/components/vendors/VendorSelect'
import { BentoCard } from '@/components/shared/BentoCard'
import { useBranchStore } from '@/lib/store/useBranchStore'
import { BRANCHES } from '@/constants'

type BranchMap = Record<string, string> // name → id

const EMPTY_ROW: Omit<ProductionEntry, 'id' | 'created_by' | 'created_at' | 'updated_at'> = {
  entry_date: '', design_code: '', branch_id: null, product_id: null,
  cut_color_1: 0, cut_color_2: 0, cut_color_3: 0, cut_color_4: 0, cut_color_5: 0,
  pe_vendor_name: null, pe_sending_qty: 0, pe_received_qty: 0,
  swing_vendor_name: null, swing_out_qty: 0, swing_in_qty: 0,
  qc_received_qty: 0, qc_output_qty: 0, qc_reject_qty: 0, qc_alter_qty: 0, qc_spot_qty: 0,
  finished_goods_qty: 0,
  dispatch_retail_qty: 0, dispatch_wholesale_qty: 0,
  stock_warehouse: 0, stock_cutting: 0, stock_swingline: 0, stock_short: 0,
}

type NumField = keyof Omit<ProductionEntry,
  'id' | 'entry_date' | 'design_code' | 'branch_id' | 'product_id' |
  'pe_vendor_name' | 'swing_vendor_name' | 'created_by' | 'created_at' | 'updated_at'>

function NumInput({ value, field, rowId, onChange }: {
  value: number; field: NumField; rowId: string
  onChange: (id: string, f: NumField, v: number) => void
}) {
  const [local, setLocal] = useState(value === 0 ? '' : String(value))
  useEffect(() => { setLocal(value === 0 ? '' : String(value)) }, [value])
  return (
    <input
      type="number" min={0} step={1} value={local} placeholder="0"
      className="w-16 h-7 text-center text-xs border-0 bg-transparent focus:bg-white focus:outline focus:outline-1 focus:outline-blue-400 rounded"
      onChange={e => setLocal(e.target.value)}
      onFocus={e => e.target.select()}
      onBlur={() => {
        const n = parseInt(local || '0', 10)
        onChange(rowId, field, isNaN(n) || n < 0 ? 0 : n)
      }}
    />
  )
}

function VendorInput({ value, rowId, field, onChange }: {
  value: string | null; rowId: string
  field: 'pe_vendor_name' | 'swing_vendor_name'
  onChange: (id: string, f: 'pe_vendor_name' | 'swing_vendor_name', v: string | null) => void
}) {
  return (
    <div className="w-28 mx-auto px-1">
      <VendorSelect 
        type={field === 'pe_vendor_name' ? 'printing' : 'sewing'}
        value={value}
        onChange={(v) => onChange(rowId, field, v)}
        className="w-full text-xs h-7 border-0 bg-transparent focus:bg-white focus:outline focus:outline-1 focus:outline-blue-400 rounded px-1 shadow-none"
      />
    </div>
  )
}

// Column group headers
const GROUP_HEADERS = [
  { label: '#',                cols: 1, cls: 'bg-slate-800 text-white' },
  { label: 'Branch',           cols: 1, cls: 'bg-slate-800 text-white' },
  { label: 'Design Code',      cols: 1, cls: 'bg-slate-700 text-white' },
  { label: 'Cut Total',        cols: 1, cls: 'bg-blue-700 text-white' },
  { label: 'Cutting (×5 colors)', cols: 5, cls: 'bg-blue-600 text-white' },
  { label: 'Print / Embroidery',  cols: 3, cls: 'bg-teal-600 text-white' },
  { label: 'Sewing / Swing',      cols: 3, cls: 'bg-orange-500 text-white' },
  { label: 'QC',                  cols: 2, cls: 'bg-green-600 text-white' },
  { label: 'Rej / Alt / Spot',    cols: 3, cls: 'bg-red-600 text-white' },
  { label: 'Finished',            cols: 1, cls: 'bg-purple-600 text-white' },
  { label: 'Dispatch',            cols: 2, cls: 'bg-sky-600 text-white' },
  { label: 'Stock',               cols: 4, cls: 'bg-slate-600 text-white' },
  { label: '',                    cols: 1, cls: 'bg-slate-100' },
]

const SUB_HEADERS = [
  '#', 'Branch', 'Code', 'Total',
  'C1','C2','C3','C4','C5',
  'Vendor','Send','Recv',
  'Vendor','OUT','IN',
  'Recv','Out',
  'Rej','Alt','Spot',
  'QTY',
  'Retail','Whlsl',
  'WH','Cut','Swing','Short',
  '',
]

export default function DailyEntrySheet() {
  const supabase = createClient()
  const today = format(new Date(), 'yyyy-MM-dd')
  const [date, setDate] = useState(today)
  const [entries, setEntries] = useState<ProductionEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<Set<string>>(new Set())
  const [branchId, setBranchId] = useState<string | null>(null)
  const [branchMap, setBranchMap] = useState<BranchMap>({})

  const { selectedBranch } = useBranchStore()

  // Fetch all branches once for name↔id resolution
  useEffect(() => {
    supabase.from('branches').select('id, name').then(({ data }) => {
      if (!data) return
      const map: BranchMap = {}
      for (const b of data) map[b.name] = b.id
      setBranchMap(map)
    })
  }, [supabase])

  // Resolve selected branch name → UUID
  useEffect(() => {
    if (!selectedBranch) { setBranchId(null); return }
    setBranchId(branchMap[selectedBranch] ?? null)
  }, [selectedBranch, branchMap])

  const fetchEntries = useCallback(async (d: string, bid: string | null) => {
    setLoading(true)
    let query = supabase.from('production_entries').select('*').eq('entry_date', d).order('created_at')
    if (bid) query = query.eq('branch_id', bid)
    const { data, error } = await query
    if (error) { toast.error('Failed to load entries'); setLoading(false); return }
    setEntries(data ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchEntries(date, branchId) }, [date, branchId, fetchEntries])

  const saveField = useCallback(async (id: string, updates: Record<string, unknown>) => {
    setSaving(prev => new Set(prev).add(id))
    const { error } = await supabase.from('production_entries').update(updates).eq('id', id)
    if (error) toast.error('Save failed')
    setSaving(prev => { const s = new Set(prev); s.delete(id); return s })
  }, [supabase])

  const handleNum = (id: string, field: NumField, value: number) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e))
    saveField(id, { [field]: value })
  }

  const handleVendor = (id: string, field: 'pe_vendor_name' | 'swing_vendor_name', value: string | null) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e))
    saveField(id, { [field]: value })
  }

  const handleBranch = (id: string, name: string) => {
    const bid = branchMap[name] ?? null
    setEntries(prev => prev.map(e => e.id === id ? { ...e, branch_id: bid } : e))
    saveField(id, { branch_id: bid })
  }

  const handleDesignCode = (id: string, code: string, productId: string | null) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, design_code: code, product_id: productId } : e))
    saveField(id, { design_code: code, product_id: productId })
  }

  const addRow = async () => {
    if (!branchId) { toast.error('Select a branch first'); return }
    if (entries.length >= MAX_DAILY_ENTRIES) { toast.error(`Max ${MAX_DAILY_ENTRIES} entries per day`); return }
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('production_entries')
      .insert({ ...EMPTY_ROW, entry_date: date, design_code: '', branch_id: branchId, created_by: user?.id })
      .select().single()
    if (error) { toast.error('Failed to add row'); return }
    setEntries(prev => [...prev, data])
  }

  const deleteRow = async (id: string) => {
    await supabase.from('production_entries').delete().eq('id', id)
    setEntries(prev => prev.filter(e => e.id !== id))
    toast.success('Row deleted')
  }

  const changeDate = (delta: number) => {
    const d = parseISO(date)
    d.setDate(d.getDate() + delta)
    setDate(format(d, 'yyyy-MM-dd'))
  }

  // Numeric field list in correct column order
  const numCols: NumField[] = [
    'cut_color_1','cut_color_2','cut_color_3','cut_color_4','cut_color_5',
    'pe_sending_qty','pe_received_qty',
    'swing_out_qty','swing_in_qty',
    'qc_received_qty','qc_output_qty',
    'qc_reject_qty','qc_alter_qty','qc_spot_qty',
    'finished_goods_qty',
    'dispatch_retail_qty','dispatch_wholesale_qty',
    'stock_warehouse','stock_cutting','stock_swingline','stock_short',
  ]

  const totals = entries.reduce((acc, e) => {
    numCols.forEach(f => { acc[f] = (acc[f] ?? 0) + (e[f] as number ?? 0) })
    return acc
  }, {} as Record<string, number>)

  const th = 'px-2 py-1 text-center text-xs font-semibold whitespace-nowrap'
  const td = 'border-b border-slate-100 text-center align-middle'

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
        <span className="text-sm text-slate-500">{format(parseISO(date), 'EEEE, dd MMM yyyy')}</span>
        {selectedBranch
          ? <span className="inline-flex items-center gap-1 text-xs font-medium text-sky-700 bg-sky-50 border border-sky-200 rounded px-2 py-0.5">
              <Store className="h-3 w-3" />{selectedBranch}
            </span>
          : <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-0.5">
              <Store className="h-3 w-3" /> Select a branch in the top bar
            </span>
        }
        <span className="ml-auto text-xs text-slate-400 flex items-center gap-2">
          {entries.length}/{MAX_DAILY_ENTRIES} entries
          {saving.size > 0 && <span className="text-blue-500">Saving…</span>}
        </span>
      </div>

      {/* Grid */}
      <BentoCard noPadding className="overflow-x-auto">
        <table className="text-xs border-collapse min-w-max">
          <thead>
            {/* Group header */}
            <tr>
              {GROUP_HEADERS.map((g, i) => (
                <th key={i} colSpan={g.cols} className={`${th} ${g.cls}`}>{g.label}</th>
              ))}
            </tr>
            {/* Sub-header */}
            <tr className="bg-slate-100 text-slate-600">
              {SUB_HEADERS.map((h, i) => <th key={i} className={th}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({length: 3}).map((_, i) => (
                <tr key={i}><td colSpan={28} className="p-2"><Skeleton className="h-7 w-full" /></td></tr>
              ))
              : entries.map((e, idx) => (
                <tr key={e.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  {/* Row # */}
                  <td className={`${td} px-2 text-slate-400 font-mono`}>{idx + 1}</td>
                  {/* Branch selector */}
                  <td className={td}>
                    <select
                      value={Object.entries(branchMap).find(([, id]) => id === e.branch_id)?.[0] ?? ''}
                      onChange={ev => handleBranch(e.id, ev.target.value)}
                      className={`h-7 text-xs rounded px-1 border-0 focus:outline focus:outline-1 focus:outline-blue-400 w-24 ${!e.branch_id ? 'bg-amber-50 text-amber-700' : 'bg-transparent'}`}
                    >
                      <option value="">— assign —</option>
                      {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </td>
                  {/* Design code with autocomplete */}
                  <td className={td}>
                    <DesignCodeInput
                      value={e.design_code}
                      rowId={e.id}
                      linkedProductId={e.product_id}
                      onSave={handleDesignCode}
                    />
                  </td>
                  {/* Cut total (computed, read-only) */}
                  <td className={`${td} font-semibold text-blue-700 px-2`}>
                    {getCutTotal(e) || ''}
                  </td>
                  {/* cut_color_1..5 */}
                  {(['cut_color_1','cut_color_2','cut_color_3','cut_color_4','cut_color_5'] as NumField[]).map(f => (
                    <td key={f} className={td}><NumInput value={e[f] as number} field={f} rowId={e.id} onChange={handleNum} /></td>
                  ))}
                  {/* PE Vendor */}
                  <td className={td}><VendorInput value={e.pe_vendor_name} rowId={e.id} field="pe_vendor_name" onChange={handleVendor} /></td>
                  {/* PE Send, Recv */}
                  {(['pe_sending_qty','pe_received_qty'] as NumField[]).map(f => (
                    <td key={f} className={td}><NumInput value={e[f] as number} field={f} rowId={e.id} onChange={handleNum} /></td>
                  ))}
                  {/* Swing Vendor */}
                  <td className={td}><VendorInput value={e.swing_vendor_name} rowId={e.id} field="swing_vendor_name" onChange={handleVendor} /></td>
                  {/* Swing OUT, IN */}
                  {(['swing_out_qty','swing_in_qty'] as NumField[]).map(f => (
                    <td key={f} className={td}><NumInput value={e[f] as number} field={f} rowId={e.id} onChange={handleNum} /></td>
                  ))}
                  {/* QC Recv, Out, Reject, Alter, Spot */}
                  {(['qc_received_qty','qc_output_qty','qc_reject_qty','qc_alter_qty','qc_spot_qty'] as NumField[]).map(f => (
                    <td key={f} className={td}><NumInput value={e[f] as number} field={f} rowId={e.id} onChange={handleNum} /></td>
                  ))}
                  {/* Finished, Retail, Wholesale */}
                  {(['finished_goods_qty','dispatch_retail_qty','dispatch_wholesale_qty'] as NumField[]).map(f => (
                    <td key={f} className={td}><NumInput value={e[f] as number} field={f} rowId={e.id} onChange={handleNum} /></td>
                  ))}
                  {/* Stock: WH, Cut, Swing, Short */}
                  {(['stock_warehouse','stock_cutting','stock_swingline','stock_short'] as NumField[]).map(f => (
                    <td key={f} className={td}><NumInput value={e[f] as number} field={f} rowId={e.id} onChange={handleNum} /></td>
                  ))}
                  {/* Delete */}
                  <td className={`${td} px-1`}>
                    <button onClick={() => deleteRow(e.id)} className="text-slate-300 hover:text-red-500 transition-colors" title="Delete">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            }

            {/* Totals row */}
            {!loading && entries.length > 0 && (
              <tr className="bg-slate-700 text-white font-semibold text-xs">
                <td className="px-2 py-1.5 sticky left-0 bg-slate-700">∑</td>
                <td />
                <td className="px-2 py-1.5 text-center">TOTAL</td>
                <td className="text-center px-2 py-1.5 font-bold text-blue-300">
                  {(totals['cut_color_1']??0)+(totals['cut_color_2']??0)+(totals['cut_color_3']??0)+(totals['cut_color_4']??0)+(totals['cut_color_5']??0) || ''}
                </td>
                
                <td className="text-center px-2 py-1.5">{totals['cut_color_1'] || ''}</td>
                <td className="text-center px-2 py-1.5">{totals['cut_color_2'] || ''}</td>
                <td className="text-center px-2 py-1.5">{totals['cut_color_3'] || ''}</td>
                <td className="text-center px-2 py-1.5">{totals['cut_color_4'] || ''}</td>
                <td className="text-center px-2 py-1.5">{totals['cut_color_5'] || ''}</td>
                
                <td />
                <td className="text-center px-2 py-1.5">{totals['pe_sending_qty'] || ''}</td>
                <td className="text-center px-2 py-1.5">{totals['pe_received_qty'] || ''}</td>
                
                <td />
                <td className="text-center px-2 py-1.5">{totals['swing_out_qty'] || ''}</td>
                <td className="text-center px-2 py-1.5">{totals['swing_in_qty'] || ''}</td>
                
                <td className="text-center px-2 py-1.5">{totals['qc_received_qty'] || ''}</td>
                <td className="text-center px-2 py-1.5">{totals['qc_output_qty'] || ''}</td>
                
                <td className="text-center px-2 py-1.5">{totals['qc_reject_qty'] || ''}</td>
                <td className="text-center px-2 py-1.5">{totals['qc_alter_qty'] || ''}</td>
                <td className="text-center px-2 py-1.5">{totals['qc_spot_qty'] || ''}</td>
                
                <td className="text-center px-2 py-1.5">{totals['finished_goods_qty'] || ''}</td>
                
                <td className="text-center px-2 py-1.5">{totals['dispatch_retail_qty'] || ''}</td>
                <td className="text-center px-2 py-1.5">{totals['dispatch_wholesale_qty'] || ''}</td>
                
                <td className="text-center px-2 py-1.5">{totals['stock_warehouse'] || ''}</td>
                <td className="text-center px-2 py-1.5">{totals['stock_cutting'] || ''}</td>
                <td className="text-center px-2 py-1.5">{totals['stock_swingline'] || ''}</td>
                <td className="text-center px-2 py-1.5">{totals['stock_short'] || ''}</td>
                
                <td />
              </tr>
            )}

            {/* Add row */}
            {!loading && entries.length < MAX_DAILY_ENTRIES && (
              <tr>
                <td colSpan={28} className="p-2">
                  <Button variant="ghost" size="sm" className="w-full text-slate-500 hover:text-slate-700" onClick={addRow}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add design code
                  </Button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </BentoCard>

      <p className="text-xs text-slate-400">
        <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-500 inline-block" /> Linked to product</span>
        <span className="inline-flex items-center gap-1 ml-4"><span className="h-2 w-2 rounded-full bg-slate-300 inline-block" /> Free-text code</span>
      </p>
    </div>
  )
}
