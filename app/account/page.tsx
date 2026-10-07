import type { Metadata } from 'next'
import { AccountView } from '@/components/flow/account-view'

export const metadata: Metadata = {
  title: 'My account | Pixovo',
  robots: { index: false },
}

export default function AccountPage() {
  return <AccountView />
}
