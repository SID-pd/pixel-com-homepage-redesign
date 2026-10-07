import type { Metadata } from 'next'
import { BlogCollection } from '@/components/content/blog-collection'

export const metadata: Metadata = {
  title: 'Photo Book Blog: Guides, Ideas & How-Tos | Pixovo',
  description: 'Practical guides, gift ideas and how-tos for turning your photos into a printed photo book you will actually open.',
  alternates: { canonical: '/blog/' },
}

export default function BlogPage() {
  return (
    <BlogCollection
      featured
      title={
        <>
          Ideas and guides for <em className="text-accent">better</em> photo books
        </>
      }
      description="Practical advice from our team: what size to pick, how to turn a trip into a book, and the mistakes worth avoiding."
    />
  )
}
