import type { Metadata } from 'next'
import { LegalDocument } from '@/components/content/legal-document'
import { getLegal } from '@/lib/content'

const doc = getLegal('privacy-policy')

export const metadata: Metadata = {
  title: doc.metaTitle || 'Privacy Policy | Pixovo',
  description: doc.metaDescription,
  alternates: { canonical: '/privacy-policy/' },
}

export default function PrivacyPolicyPage() {
  return <LegalDocument doc={doc} other={{ href: '/terms/', label: 'Terms & Conditions' }} />
}
