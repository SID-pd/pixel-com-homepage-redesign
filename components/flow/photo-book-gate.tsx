'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { MarketingShell } from '@/components/content/blocks'
import { PhotoBookIntro } from './photo-book-intro'
import { Wizard } from './wizard'

/**
 * Deep links (homepage Templates section, pricing CTAs, promo banners, Story Mode)
 * must keep jumping straight into the Wizard, so the intro only shows on a bare visit.
 */
export function PhotoBookGate() {
  const params = useSearchParams()
  const hasDeepLink = !!(params.get('size') || params.get('template') || params.get('promo') || params.get('story'))
  const [started, setStarted] = useState(hasDeepLink)

  if (!started) {
    return (
      <MarketingShell>
        <PhotoBookIntro onStart={() => setStarted(true)} />
      </MarketingShell>
    )
  }

  return <Wizard />
}
