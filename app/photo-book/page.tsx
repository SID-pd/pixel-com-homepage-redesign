import type { Metadata } from 'next'
import { Suspense } from 'react'
import { PhotoBookGate } from '@/components/flow/photo-book-gate'

export const metadata: Metadata = {
  title: 'Create your photo book | Pixovo',
  description: 'Pick a size, add your photos and order your custom photo book in three simple steps.',
}

export default function PhotoBookPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-background" />}>
      <PhotoBookGate />
    </Suspense>
  )
}
