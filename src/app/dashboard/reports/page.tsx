'use client'
import { useState, useEffect } from 'react'
import { format, subDays } from 'date-fns'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import DateRangePicker, { type DateRange } from '@/components/reports/DateRangePicker'
import DailyProductionReport from '@/components/reports/DailyProductionReport'
import DesignProgressReport from '@/components/reports/DesignProgressReport'
import RejectionReport from '@/components/reports/RejectionReport'
import BranchDispatchReport from '@/components/reports/BranchDispatchReport'
import { useBranchStore } from '@/lib/store/useBranchStore'
import { createClient } from '@/lib/supabase/client'

const defaultRange = (): DateRange => ({
  from: format(subDays(new Date(), 6), 'yyyy-MM-dd'),
  to: format(new Date(), 'yyyy-MM-dd'),
})

export default function ReportsPage() {
  const [range, setRange] = useState<DateRange>(defaultRange)
  const [branchId, setBranchId] = useState<string | null>(null)
  const { selectedBranch } = useBranchStore()

  useEffect(() => {
    if (!selectedBranch) { setBranchId(null); return }
    const supabase = createClient()
    supabase.from('branches').select('id').eq('name', selectedBranch).single()
      .then(({ data }) => setBranchId(data?.id ?? null))
  }, [selectedBranch])

  return (
    <div className="space-y-5 max-w-7xl">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">Reports</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Date-range production reports with CSV export
          {selectedBranch && (
            <span className="ml-2 text-sky-600 font-medium">· filtered to {selectedBranch}</span>
          )}
        </p>
      </div>

      <Tabs defaultValue="daily">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <TabsList className="shrink-0">
            <TabsTrigger value="daily">Daily Production</TabsTrigger>
            <TabsTrigger value="designs">Design Progress</TabsTrigger>
            <TabsTrigger value="rejection">Rejection / DHU</TabsTrigger>
            <TabsTrigger value="dispatch">Branch Dispatch</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="daily" className="mt-4">
          <DailyProductionReport
            range={range}
            branchId={branchId}
            headerControls={<DateRangePicker value={range} onChange={setRange} />}
          />
        </TabsContent>

        <TabsContent value="designs" className="mt-4">
          <DesignProgressReport />
        </TabsContent>

        <TabsContent value="rejection" className="mt-4">
          <RejectionReport
            range={range}
            branchId={branchId}
            headerControls={<DateRangePicker value={range} onChange={setRange} />}
          />
        </TabsContent>

        <TabsContent value="dispatch" className="mt-4">
          <BranchDispatchReport
            range={range}
            selectedBranch={selectedBranch}
            headerControls={<DateRangePicker value={range} onChange={setRange} />}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
