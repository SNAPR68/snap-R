import { Suspense } from 'react'
import PrintDashboard from './PrintDashboard'

export const dynamic = 'force-dynamic'

export default function PrintPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#D4A017] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <PrintDashboard />
    </Suspense>
  )
}
