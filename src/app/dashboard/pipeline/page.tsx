import PipelineBoard from '@/components/pipeline/PipelineBoard'

export default function PipelinePage() {
  return (
    <div className="space-y-5 max-w-7xl">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">Active Pipeline</h2>
        <p className="text-sm text-slate-500 mt-0.5">All designs currently in production — stale designs flagged in red</p>
      </div>
      <PipelineBoard />
    </div>
  )
}
