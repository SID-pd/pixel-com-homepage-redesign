'use client'

import { useSyncExternalStore } from 'react'

/** Live `matchMedia` flag. `server` is what the first (server/hydration) render sees. */
export function useMediaQuery(query: string, server = false) {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(query)
      m.addEventListener('change', cb)
      return () => m.removeEventListener('change', cb)
    },
    () => window.matchMedia(query).matches,
    () => server,
  )
}
