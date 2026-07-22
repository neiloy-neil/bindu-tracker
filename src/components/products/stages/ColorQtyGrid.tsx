'use client'
import { useState, useEffect } from 'react'

type ColorSlot = { name: string | null }

export default function ColorQtyGrid({
  label,
  colors,
  values,
  onChange,
  readOnly = false,
}: {
  label: string
  colors: ColorSlot[]
  values: number[]
  onChange: (index: number, qty: number) => void
  readOnly?: boolean
}) {
  const active = colors.filter(c => c.name)
  if (active.length === 0) return null

  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3 space-y-2">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1.5">
        {colors.map((c, i) => {
          if (!c.name) return null
          return (
            <ColorQtyRow
              key={i}
              name={c.name}
              value={values[i] ?? 0}
              readOnly={readOnly}
              onChange={qty => onChange(i, qty)}
            />
          )
        })}
      </div>
      <div className="pt-1 border-t border-slate-200 flex justify-between text-xs text-slate-500">
        <span>Total</span>
        <span className="font-semibold text-slate-700">
          {values.reduce((s, v) => s + (v ?? 0), 0).toLocaleString()} pcs
        </span>
      </div>
    </div>
  )
}

function ColorQtyRow({ name, value, readOnly, onChange }: {
  name: string; value: number; readOnly: boolean; onChange: (v: number) => void
}) {
  const [local, setLocal] = useState(value === 0 ? '' : String(value))
  useEffect(() => { setLocal(value === 0 ? '' : String(value)) }, [value])

  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-slate-600 truncate">{name}</span>
      {readOnly ? (
        <span className="text-xs font-medium text-slate-700 w-16 text-right">{value.toLocaleString()}</span>
      ) : (
        <input
          type="number" min={0}
          className="w-16 border rounded px-1.5 py-0.5 text-xs text-right focus:outline-none focus:ring-1 focus:ring-blue-400"
          value={local} placeholder="0"
          onChange={e => setLocal(e.target.value)}
          onFocus={e => e.target.select()}
          onBlur={e => { const v = parseInt(e.target.value) || 0; setLocal(v === 0 ? '' : String(v)); onChange(v) }}
        />
      )}
    </div>
  )
}
