'use client'
import { ReactNode, useEffect, useState, cloneElement, isValidElement } from 'react'

type Props = {
  title: string
  value: string | number
  icon: ReactNode
  color: 'blue' | 'teal' | 'purple' | 'sky' | 'amber' | 'red'
  sub?: string
  trend?: 'up' | 'down' | 'neutral'
}

const ACCENT_BORDER = {
  blue:   'border-l-blue-500 group-hover:border-l-blue-400',
  teal:   'border-l-teal-500 group-hover:border-l-teal-400',
  purple: 'border-l-purple-500 group-hover:border-l-purple-400',
  sky:    'border-l-sky-500 group-hover:border-l-sky-400',
  amber:  'border-l-amber-500 group-hover:border-l-amber-400',
  red:    'border-l-red-500 group-hover:border-l-red-400',
}

const VALUE_COLOR = {
  blue:   'text-blue-700',
  teal:   'text-teal-700',
  purple: 'text-purple-700',
  sky:    'text-sky-700',
  amber:  'text-amber-700',
  red:    'text-red-700',
}

const ICON_COLOR = {
  blue:   'text-blue-500',
  teal:   'text-teal-500',
  purple: 'text-purple-500',
  sky:    'text-sky-500',
  amber:  'text-amber-500',
  red:    'text-red-500',
}

export default function KPICard({ title, value, icon, color, sub }: Props) {
  const [displayValue, setDisplayValue] = useState<string | number>(0)

  useEffect(() => {
    // Simple count up effect if it's a number
    if (typeof value === 'number') {
      let start = 0
      const end = value
      const duration = 500
      let startTime: number | null = null
      
      const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp
        const progress = Math.min((timestamp - startTime) / duration, 1)
        // easeOutQuart
        const ease = 1 - Math.pow(1 - progress, 4)
        setDisplayValue(Math.floor(ease * end))
        
        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          setDisplayValue(end)
        }
      }
      requestAnimationFrame(animate)
    } else {
      setDisplayValue(value)
    }
  }, [value])

  return (
    <div className={`group bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:border-slate-300 hover:shadow-md transition-all duration-300 relative`}>
      <div className="absolute inset-0 bg-gradient-to-br from-white to-slate-50/50 pointer-events-none" />
      <div className="px-5 py-5 relative z-10 flex flex-col h-full justify-between">
        <div className="flex items-start justify-between gap-3 mb-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 leading-none mt-1 transition-colors group-hover:text-slate-700">{title}</p>
          <div className={`p-1.5 rounded-md bg-${color}-50 transition-transform group-hover:scale-110 duration-300 flex items-center justify-center border border-${color}-100`}>
            {isValidElement(icon)
              ? cloneElement(icon as React.ReactElement<any>, { className: `h-4 w-4 shrink-0 ${ICON_COLOR[color]}` })
              : icon}
          </div>
        </div>
        <div>
          <p className="text-3xl font-black tabular-nums leading-none tracking-tight text-slate-800">
            {typeof displayValue === 'number' ? displayValue.toLocaleString() : displayValue}
          </p>
          {sub && <p className="text-[12px] font-medium text-slate-400 mt-2 leading-none">{sub}</p>}
        </div>
      </div>
    </div>
  )
}
