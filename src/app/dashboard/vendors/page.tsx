import VendorsTable from '@/components/vendors/VendorsTable'

export default function VendorsPage() {
  return (
    <div className="max-w-4xl space-y-6 animate-fade-up">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-black text-foreground tracking-tight">Vendor Management</h2>
          <p className="text-sm font-medium text-muted-foreground mt-1">Manage printing and sewing vendors.</p>
        </div>
      </div>
      <VendorsTable />
    </div>
  )
}
