import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileQuestion } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center p-8 bg-slate-50 text-center">
      <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center mx-auto mb-6">
        <FileQuestion className="h-8 w-8 text-slate-400" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Page Not Found</h2>
      <p className="text-slate-500 mb-8 max-w-md">
        The page you are looking for doesn&apos;t exist or has been moved. Check the URL or navigate back to the dashboard.
      </p>
      <Link href="/dashboard">
        <Button size="lg" className="bg-[#1A3557] hover:bg-[#1A3557]/90 text-white">
          Return to Dashboard
        </Button>
      </Link>
    </div>
  )
}
