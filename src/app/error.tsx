'use client'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // We could log the error to an error reporting service here
    console.error(error)
  }, [error])

  return (
    <div className="flex h-[80vh] w-full flex-col items-center justify-center p-8 bg-slate-50 text-center">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-100 max-w-md w-full">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="h-6 w-6 text-red-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Something went wrong!</h2>
        <p className="text-sm text-slate-500 mb-6">
          An unexpected error occurred while loading this page. Our team has been notified.
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => window.location.href = '/dashboard'} variant="outline">
            Go Home
          </Button>
          <Button onClick={() => reset()} className="bg-red-600 hover:bg-red-700 text-white">
            Try Again
          </Button>
        </div>
      </div>
    </div>
  )
}

