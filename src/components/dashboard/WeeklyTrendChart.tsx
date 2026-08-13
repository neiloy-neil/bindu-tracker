'use client'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

type WeekPoint = {
  week: string
  Cut: number
  Finished: number
  Dispatched: number
}

export default function WeeklyTrendChart({ data }: { data: WeekPoint[] }) {
  if (!data.length) {
    return (
      <div className="h-52 flex items-center justify-center">
        <p className="text-xs text-slate-400">No production data in the last 8 weeks.</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={210}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barCategoryGap="30%">
        <CartesianGrid strokeDasharray="2 4" stroke="#E2E8F0" vertical={false} />
        <XAxis
          dataKey="week"
          tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 500 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: '#94A3B8' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            fontSize: 12,
            borderRadius: 6,
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 8px rgba(0,0,0,0.06)',
            background: '#fff',
          }}
          cursor={{ fill: 'rgba(241,245,249,0.8)' }}
        />
        <Legend
          wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
          iconType="circle"
          iconSize={6}
        />
        <Bar dataKey="Cut"        fill="#3B82F6" radius={[3, 3, 0, 0]} maxBarSize={24} />
        <Bar dataKey="Finished"   fill="#9333EA" radius={[3, 3, 0, 0]} maxBarSize={24} />
        <Bar dataKey="Dispatched" fill="#0EA5E9" radius={[3, 3, 0, 0]} maxBarSize={24} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export type { WeekPoint }
