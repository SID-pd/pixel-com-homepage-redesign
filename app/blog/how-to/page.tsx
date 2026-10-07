import type { Metadata } from 'next'
import { BlogCollection } from '@/components/content/blog-collection'

export const metadata: Metadata = {
  title: 'How-To Guides for Photo Books | Pixovo',
  description: 'Step-by-step guides: make a photo book from your phone in minutes and choose the right size.',
  alternates: { canonical: '/blog/how-to/' },
}

export default function BlogHowToPage() {
  return (
    <BlogCollection
      eyebrow="How-to guides"
      topic="How-To"
      title={
        <>
          Make it, <em className="text-accent">step by step</em>
        </>
      }
      description="Straightforward walkthroughs so you can go from camera roll to finished book without guessing."
    />
  )
}
