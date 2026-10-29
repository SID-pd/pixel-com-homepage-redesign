'use client'

import { useState, type MouseEvent } from 'react'
import { useRouter } from 'next/navigation'
import { curtain } from '@/components/flow/page-curtain'
import { flow } from '@/lib/flow/store'
import type { BookConfig } from '@/lib/flow/types'

/** What you can do with the finished book: send it to checkout, or open it in the editor. Shared by every layout of the preview. */
export function usePreviewActions(config: BookConfig) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function checkout(e: MouseEvent) {
    const origin = { x: e.clientX, y: e.clientY }
    setBusy(true)
    // basic packaging unless they choose another at checkout
    if (!config.packaging) flow.setConfig({ packaging: 'basic' })
    await flow.addToCart()
    curtain.go(router, '/checkout/', 'Taking you to checkout…', origin)
  }

  const edit = (e: MouseEvent) => curtain.go(router, '/photo-book/editor/', 'Opening the editor…', { x: e.clientX, y: e.clientY })

  return { busy, checkout, edit }
}
