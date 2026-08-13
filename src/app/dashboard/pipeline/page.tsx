import PipelineBoard from '@/components/pipeline/PipelineBoard'

export default function PipelinePage() {
  return (
    <div className="space-y-6 max-w-7xl animate-fade-up">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-black text-foreground tracking-tight">Active Pipeline</h2>
          <p className="text-sm font-medium text-muted-foreground mt-1">All designs currently in production — stale designs flagged in amber</p>
        </div>
      </div>
      <PipelineBoard />
    </div>
  )
}
