import DailyLogs from '@/components/daily/DailyLogs'

export default function DailyPage() {
  return (
    <div className="space-y-6 max-w-5xl animate-fade-up">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-black text-foreground tracking-tight">Daily Production Logs</h2>
          <p className="text-sm font-medium text-muted-foreground mt-1">Real-time activity feed and daily entry records</p>
        </div>
      </div>
      <DailyLogs />
    </div>
  )
}
