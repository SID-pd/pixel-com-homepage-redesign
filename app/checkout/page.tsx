import type { Metadata } from 'next'
import { CheckoutView } from '@/components/flow/checkout-view'

export const metadata: Metadata = { title: 'Checkout | Pixovo' }

export default function CheckoutPage() {
  return <CheckoutView />
}
