import type { Metadata } from 'next'
import { CartView } from '@/components/flow/cart-view'

export const metadata: Metadata = { title: 'Your cart | Pixovo' }

export default function CartPage() {
  return <CartView />
}
