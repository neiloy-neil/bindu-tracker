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
        "bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col transition-shadow hover:shadow-md",
        !noPadding && "p-6",
        className
      )}
    >
      {children}
    </div>
  )
}
