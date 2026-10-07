import type { Metadata } from 'next'
import { LegalDocument } from '@/components/content/legal-document'
import { getLegal } from '@/lib/content'

const doc = getLegal('terms')

export const metadata: Metadata = {
  title: doc.metaTitle || 'Terms & Conditions | Pixovo',
  description: doc.metaDescription,
  alternates: { canonical: '/terms/' },
}

export default function TermsPage() {
  return <LegalDocument doc={doc} other={{ href: '/privacy-policy/', label: 'Privacy Policy' }} />
}
