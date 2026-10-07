import type { Metadata } from 'next'
import { Suspense } from 'react'
import { ThankYouView } from '@/components/flow/thank-you-view'

export const metadata: Metadata = { title: 'Order confirmed | Pixovo' }

export default function ThankYouPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-background" />}>
      <ThankYouView />
    </Suspense>
  )
}
