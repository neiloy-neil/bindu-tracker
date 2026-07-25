'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { format, parseISO } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { MAX_DAILY_ENTRIES } from '@/constants'
import DesignCodeInput from './DesignCodeInput'
import { BentoCard } from '@/components/shared/BentoCard'
import ProductSummaryRow from './ProductSummaryRow'

type Entry = {
  id: string
  entry_date: string
  design_code: string
  product_id: string | null
  notes: string | null
  created_by: string | null
}

export default function DailyEntrySheet() {
  const supabase = createClient()
  const today = format(new Date(), 'yyyy-MM-dd')
  const [date, setDate] = useState(today)
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<Set<string>>(new Set())

  const fetchEntries = useCallback(async (d: string) => {
    setLoading(true)
    const { data, error } = await supabase
      .from('production_entries')
      .select('id, entry_date, design_code, product_id, notes, created_by')
      .eq('entry_date', d)
      .order('created_at')
    if (error) { toast.error('Failed to load entries'); setLoading(false); return }
    setEntries(data ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchEntries(date) }, [date, fetchEntries])

  const saveField = useCallback(async (id: string, updates: Record<string, unknown>) => {
    setSaving(prev => new Set(prev).add(id))
    const { error } = await supabase.from('production_entries').update(updates).eq('id', id)
    if (error) toast.error('Save failed')
    setSaving(prev => { const s = new Set(prev); s.delete(id); return s })
  }, [supabase])

  const handleDesignCode = (id: string, code: string, productId: string | null) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, design_code: code, product_id: productId } : e))
    saveField(id, { design_code: code, product_id: productId })
  }

  const handleNotes = (id: string, notes: string) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, notes } : e))
    saveField(id, { notes: notes || null })
  }

  const addRow = async () => {
    if (entries.length >= MAX_DAILY_ENTRIES) { toast.error(`Max ${MAX_DAILY_ENTRIES} entries per day`); return }
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('production_entries')
      .insert({ entry_date: date, design_code: '', product_id: null, notes: null, created_by: user?.id })
      .select('id, entry_date, design_code, product_id, notes, created_by')
      .single()
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

  const th = 'px-3 py-2 text-left text-xs font-semibold whitespace-nowrap'
  const td = 'border-b border-slate-100 align-middle'

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
        <span className="ml-auto text-xs text-slate-400 flex items-center gap-2">
          {entries.length}/{MAX_DAILY_ENTRIES} entries
          {saving.size > 0 && <span className="text-blue-500">Saving…</span>}
        </span>
      </div>

      {/* How-to tip */}
      {entries.length === 0 && (
        <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-800 space-y-1">
          <p className="font-semibold">Daily Activity Log</p>
          <ol className="list-decimal list-inside space-y-0.5 text-blue-700 text-xs">
            <li>Pick the date using the arrow buttons or the date field above</li>
            <li>Click <strong>Add entry</strong> to log a design code worked on today</li>
            <li>Linking a design code shows the product&apos;s current stage and quantities for quick reference</li>
            <li>Add any notes or remarks — entries save automatically</li>
          </ol>
        </div>
      )}

      {/* Grid */}
      <BentoCard noPadding>
        <table className="text-xs border-collapse w-full">
          <thead>
            <tr className="bg-slate-800 text-white">
              <th className={`${th} w-8 text-center`}>#</th>
              <th className={th}>Design Code</th>
              <th className={th}>Notes / Remarks</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}><td colSpan={4} className="p-2"><Skeleton className="h-8 w-full" /></td></tr>
                ))
              : entries.map((e, idx) => (
                  <React.Fragment key={e.id}>
                    <tr className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className={`${td} px-3 text-center text-slate-400 font-mono`}>{idx + 1}</td>
                      <td className={`${td} px-2 py-1.5`}>
                        <DesignCodeInput
                          value={e.design_code}
                          rowId={e.id}
                          linkedProductId={e.product_id}
                          onSave={handleDesignCode}
                        />
                      </td>
                      <td className={`${td} px-2 py-1`}>
                        <NotesInput
                          value={e.notes ?? ''}
                          onBlur={v => handleNotes(e.id, v)}
                        />
                      </td>
                      <td className={`${td} px-2`}>
                        <button onClick={() => deleteRow(e.id)} className="text-slate-300 hover:text-red-500 transition-colors" title="Delete">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                    {e.product_id && (
                      <ProductSummaryRow productId={e.product_id} colSpan={4} />
                    )}
                  </React.Fragment>
                ))
            }

            {/* Add row */}
            {!loading && entries.length < MAX_DAILY_ENTRIES && (
              <tr>
                <td colSpan={4} className="p-2">
                  <Button variant="ghost" size="sm" className="w-full text-slate-500 hover:text-slate-700" onClick={addRow}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add entry
                  </Button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </BentoCard>

      <p className="text-xs text-slate-400 flex items-center gap-4">
        <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-500 inline-block" /> Linked to product — shows live stage summary</span>
        <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-slate-300 inline-block" /> Free-text code</span>
      </p>
    </div>
  )
}

function NotesInput({ value, onBlur }: { value: string; onBlur: (v: string) => void }) {
  const [local, setLocal] = useState(value)
  useEffect(() => { setLocal(value) }, [value])
  return (
    <input
      type="text"
      value={local}
      placeholder="Add a note…"
      className="w-full h-7 text-xs border-0 bg-transparent focus:bg-white focus:outline focus:outline-1 focus:outline-blue-400 rounded px-1 text-slate-600 placeholder:text-slate-300"
      onChange={e => setLocal(e.target.value)}
      onBlur={() => onBlur(local)}
    />
  )
}
