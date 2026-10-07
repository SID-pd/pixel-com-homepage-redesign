import type { Metadata } from 'next'
import { BlogCollection } from '@/components/content/blog-collection'

export const metadata: Metadata = {
  title: 'Photo Book Ideas & Inspiration | Pixovo',
  description: 'Wedding, travel, fall and gift photo book ideas, with layouts and tips to make yours worth keeping.',
  alternates: { canonical: '/blog/ideas/' },
}

export default function BlogIdeasPage() {
  return (
    <BlogCollection
      eyebrow="Ideas"
      topic="Ideas"
      title={
        <>
          Photo book <em className="text-accent">ideas</em> and inspiration
        </>
      }
      description="Themes, layouts and storytelling ideas for weddings, trips, seasons and gifts."
    />
  )
}
