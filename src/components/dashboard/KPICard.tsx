import { LucideIcon } from 'lucide-react'
import { BentoCard } from '@/components/shared/BentoCard'

type Props = {
  title: string
  value: string | number
  icon: LucideIcon
  color: 'blue' | 'teal' | 'purple' | 'sky'
  sub?: string
}

const COLORS = {
  blue:   'bg-blue-50 border-blue-200 text-blue-700',
  teal:   'bg-teal-50 border-teal-200 text-teal-700',
  purple: 'bg-purple-50 border-purple-200 text-purple-700',
  sky:    'bg-sky-50 border-sky-200 text-sky-700',
}

const ICON_COLORS = {
  blue:   'text-blue-500',
  teal:   'text-teal-500',
  purple: 'text-purple-500',
  sky:    'text-sky-500',
}

export default function KPICard({ title, value, icon: Icon, color, sub }: Props) {
  return (
    <BentoCard className={COLORS[color]}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide opacity-70">{title}</p>
          <p className="text-3xl font-bold mt-1">{typeof value === 'number' ? value.toLocaleString() : value}</p>
          {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
        </div>
        <Icon className={`h-6 w-6 ${ICON_COLORS[color]} opacity-60`} />
      </div>
    </BentoCard>
  )
}
