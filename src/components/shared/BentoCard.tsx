import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface BentoCardProps {
  children: ReactNode
  className?: string
  noPadding?: boolean
}

export function BentoCard({ children, className, noPadding = false }: BentoCardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-lg border border-slate-200 shadow-card overflow-hidden flex flex-col",
        !noPadding && "p-5",
        className
      )}
    >
      {children}
    </div>
  )
}
