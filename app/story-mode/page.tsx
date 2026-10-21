import type { Metadata } from 'next'
import { StoryStudio } from '@/components/story/story-studio'

export const metadata: Metadata = {
  title: 'Story Mode: Turn Your Photos Into a Custom Storybook | Pixovo',
  description:
    'Describe your memory, upload your photos, and Pixovo organizes the moments, builds a natural story flow, writes captions and designs the layouts. Review and customize before you save or print.',
  alternates: { canonical: '/story-mode/' },
}

export default function StoryModePage() {
  return <StoryStudio />
}
