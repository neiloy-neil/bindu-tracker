'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

type ProductMatch = { id: string; product_code: string; product_name: string }

type Props = {
  value: string
  rowId: string
  linkedProductId: string | null
  onSave: (rowId: string, code: string, productId: string | null) => void
}

export default function DesignCodeInput({ value, rowId, linkedProductId, onSave }: Props) {
  const supabase = createClient()
  const [local, setLocal] = useState(value)
  const [matches, setMatches] = useState<ProductMatch[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => { setLocal(value) }, [value])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const search = useCallback(async (term: string) => {
    if (!term.trim()) { setMatches([]); setOpen(false); return }
    const { data } = await supabase
      .from('products')
      .select('id, product_code, product_name')
      .ilike('product_code', `%${term}%`)
      .limit(8)
    setMatches(data ?? [])
    setOpen((data?.length ?? 0) > 0)
  }, [supabase])

  // Debounce search
  const timerRef = useRef<ReturnType<typeof setTimeout>>()
  const handleChange = (v: string) => {
    setLocal(v)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => search(v), 300)
  }

  const selectedRef = useRef(false)

  const handleSelect = (match: ProductMatch) => {
    selectedRef.current = true
    setLocal(match.product_code)
    setOpen(false)
    onSave(rowId, match.product_code, match.id)
  }

  const handleBlur = () => {
    setTimeout(() => {
      setOpen(false)
      // If user typed freely (didn't pick from dropdown), clear product link
      const pid = selectedRef.current ? linkedProductId : (local === value ? linkedProductId : null)
      selectedRef.current = false
      onSave(rowId, local, pid)
    }, 150)
  }

  const isLinked = !!linkedProductId

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center gap-1">
        <span
          className={`h-2 w-2 rounded-full shrink-0 ${isLinked ? 'bg-blue-500' : 'bg-slate-300'}`}
          title={isLinked ? 'Linked to product' : 'Free-text code'}
        />
        <input
          type="text"
          value={local}
          placeholder="3001"
          className="w-20 h-7 text-xs border-0 bg-transparent focus:bg-white focus:outline focus:outline-1 focus:outline-blue-400 rounded px-1"
          onChange={e => handleChange(e.target.value)}
          onBlur={handleBlur}
          onFocus={() => local && search(local)}
        />
      </div>

      {open && matches.length > 0 && (
        <div className="absolute top-full left-0 z-50 mt-1 w-56 bg-white border border-slate-200 rounded-md shadow-lg text-xs overflow-hidden">
          {matches.map(m => (
            <button
              key={m.id}
              type="button"
              className="w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors"
              onMouseDown={() => handleSelect(m)}
            >
              <div className="font-medium text-slate-800">{m.product_code}</div>
              <div className="text-slate-400 truncate">{m.product_name}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
