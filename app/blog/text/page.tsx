import type { Metadata } from 'next'
import { BlogCollection } from '@/components/content/blog-collection'

export const metadata: Metadata = {
  title: 'Stories & Articles | Pixovo Blog',
  description: 'Every Pixovo article in one place: guides, comparisons and ideas for photo books.',
  alternates: { canonical: '/blog/text/' },
}

export default function BlogArticlesPage() {
  return (
    <BlogCollection
      eyebrow="All articles"
      title={
        <>
          Stories &amp; <em className="text-accent">articles</em>
        </>
      }
      description="Everything we have written about photo books, in one place."
    />
  )
}
