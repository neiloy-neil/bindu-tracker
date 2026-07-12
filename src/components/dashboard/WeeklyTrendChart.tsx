'use client'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

type WeekPoint = {
  week: string   // e.g. "Jun 30"
  Cut: number
  Finished: number
  Dispatched: number
}

export default function WeeklyTrendChart({ data }: { data: WeekPoint[] }) {
  if (!data.length) {
    return (
      <div className="h-52 flex items-center justify-center text-sm text-slate-400">
        No production data in the last 8 weeks.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }} barCategoryGap="28%">
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}
          cursor={{ fill: '#f8fafc' }}
        />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        <Bar dataKey="Cut"        fill="#3b82f6" radius={[3,3,0,0]} maxBarSize={28} />
        <Bar dataKey="Finished"   fill="#a855f7" radius={[3,3,0,0]} maxBarSize={28} />
        <Bar dataKey="Dispatched" fill="#0ea5e9" radius={[3,3,0,0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export type { WeekPoint }
