import { redirect } from 'next/navigation'

// The CMS has a "terms-of-use" stub with no content; the real document lives at /terms.
export default function TermsOfUseRedirect() {
  redirect('/terms/')
}
