import VendorsTable from '@/components/vendors/VendorsTable'

export default function VendorsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Vendors</h2>
        <p className="text-sm text-slate-500 mt-1">Manage printing and sewing vendors.</p>
      </div>
      <VendorsTable />
    </div>
  )
}
