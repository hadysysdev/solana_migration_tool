"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw } from "lucide-react"
import Link from "next/link"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to error reporting service
    console.error("w3Swap page error:", error)
  }, [error])

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-6 flex justify-center">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold mb-4 text-white">
          Something went wrong
        </h1>
        
        <p className="text-slate-400 mb-8">
          We encountered an unexpected error. Please try again or return to the homepage.
        </p>

        {error.digest && (
          <p className="text-xs text-slate-500 mb-6 font-mono">
            Error ID: {error.digest}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={reset}
            className="btn-brand inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </Button>
          
          <Link href="/">
            <Button
              variant="outline"
              className="border-slate-700 text-slate-300 hover:border-slate-600 hover:text-white"
            >
              Go to homepage
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

