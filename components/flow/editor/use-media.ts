'use client'

import { useSyncExternalStore } from 'react'

export type Mode = 'mobile' | 'tablet' | 'desktop'

function get(): Mode {
  const w = window.innerWidth
  return w < 640 ? 'mobile' : w < 1024 ? 'tablet' : 'desktop'
}

function subscribe(cb: () => void) {
  window.addEventListener('resize', cb)
  window.addEventListener('orientationchange', cb)
  return () => {
    window.removeEventListener('resize', cb)
    window.removeEventListener('orientationchange', cb)
  }
}

/** Editor layout mode. Server snapshot is 'desktop'; the editor shows a skeleton until hydrated, so no mismatch is visible. */
export function useMode(): Mode {
  return useSyncExternalStore(subscribe, get, () => 'desktop')
}
