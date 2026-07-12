'use client'
import { useState } from 'react'
import { format, subDays, startOfMonth, subMonths } from 'date-fns'
import { Button } from '@/components/ui/button'

export type DateRange = { from: string; to: string }

type Preset = { label: string; range: () => DateRange }

const today = () => format(new Date(), 'yyyy-MM-dd')

const PRESETS: Preset[] = [
  { label: 'Today',      range: () => ({ from: today(), to: today() }) },
  { label: 'Last 7 days',range: () => ({ from: format(subDays(new Date(), 6), 'yyyy-MM-dd'), to: today() }) },
  { label: 'This Month', range: () => ({ from: format(startOfMonth(new Date()), 'yyyy-MM-dd'), to: today() }) },
  { label: 'Last Month', range: () => {
    const start = startOfMonth(subMonths(new Date(), 1))
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0)
    return { from: format(start, 'yyyy-MM-dd'), to: format(end, 'yyyy-MM-dd') }
  }},
]

type Props = { value: DateRange; onChange: (r: DateRange) => void }

export default function DateRangePicker({ value, onChange }: Props) {
  const [custom, setCustom] = useState(false)

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {PRESETS.map(p => {
        const r = p.range()
        const active = !custom && value.from === r.from && value.to === r.to
        return (
          <Button
            key={p.label}
            size="sm"
            variant={active ? 'default' : 'outline'}
            className={active ? 'bg-[#1A3557] hover:bg-[#142a45] h-7 text-xs' : 'h-7 text-xs'}
            onClick={() => { setCustom(false); onChange(r) }}
          >
            {p.label}
          </Button>
        )
      })}
      <div className="flex items-center gap-1 ml-2">
        <input
          type="date" value={value.from}
          className="border rounded px-2 py-1 text-xs h-7"
          onChange={e => { setCustom(true); onChange({ ...value, from: e.target.value }) }}
        />
        <span className="text-xs text-slate-400">→</span>
        <input
          type="date" value={value.to}
          className="border rounded px-2 py-1 text-xs h-7"
          onChange={e => { setCustom(true); onChange({ ...value, to: e.target.value }) }}
        />
      </div>
    </div>
  )
}
