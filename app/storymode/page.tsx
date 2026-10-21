import type { Metadata } from 'next'
import { ChatWizard } from '@/components/storymode/chat-wizard'

// The chat-led version of the step-by-step flow. Nothing on the site links here yet, so it is kept out of search too.
export const metadata: Metadata = {
  title: 'Story Mode | Pixovo',
  description: 'Chat with Pixie to choose your book, add your photos, check them, and preview your finished photo book.',
  robots: { index: false, follow: false },
}

export default function StoryModeWizardPage() {
  return <ChatWizard />
}
