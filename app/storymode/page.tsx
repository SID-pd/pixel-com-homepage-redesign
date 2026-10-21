import type { Metadata } from 'next'
import { StoryModeWizard } from '@/components/storymode/wizard'

// A standalone step-by-step version of Story Mode. Nothing on the site links here yet, so it is kept out of search too.
export const metadata: Metadata = {
  title: 'Story Mode | Pixovo',
  description: 'Choose your book, add your photos, check them, and preview your finished photo book.',
  robots: { index: false, follow: false },
}

export default function StoryModeWizardPage() {
  return <StoryModeWizard />
}
