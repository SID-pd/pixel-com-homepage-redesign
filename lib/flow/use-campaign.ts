'use client'

import { useEffect, useState } from 'react'
import { activeCampaign, type Campaign } from './catalog'

/**
 * The sale running today (null between sales). Resolved after mount on purpose: the page HTML is prerendered,
 * so reading the date during render could ship yesterday's sale and cause a hydration mismatch.
 */
export function useCampaign(): Campaign | null {
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  useEffect(() => {
    setCampaign(activeCampaign())
    // re-check once a minute so a long-open tab flips at midnight Pacific
    const t = setInterval(() => setCampaign(activeCampaign()), 60_000)
    return () => clearInterval(t)
  }, [])
  return campaign
}
