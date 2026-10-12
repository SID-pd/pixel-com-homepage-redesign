import { allCards, TOPICS } from '@/lib/content/blog'
import { CtaBand, MarketingShell, PageHero } from './blocks'
import { BlogBrowser } from './blog-ui'

export function BlogCollection({
  eyebrow = 'The Pixovo blog',
  title,
  description,
  topic = 'All',
}: {
  eyebrow?: string
  title: React.ReactNode
  description?: string
  topic?: string
  featured?: boolean // kept for callers; the blog index no longer renders a featured hero
}) {
  const posts = allCards()
  const scoped = topic === 'All' ? posts : posts.filter((p) => p.topic === topic)
  return (
    <MarketingShell>
      <PageHero
        eyebrow={eyebrow}
        title={title}
        description={description}
        image="/images/hero-book.png"
        imageAlt="An open Pixovo photo book"
      />
      <section className="px-5 pb-16 pt-14 md:px-6 md:pb-24 md:pt-20">
        <div className="mx-auto max-w-6xl space-y-10">
          <BlogBrowser posts={scoped} topics={topic === 'All' ? TOPICS : []} />
        </div>
      </section>
      <CtaBand title="Your photos deserve more than a camera roll" />
    </MarketingShell>
  )
}
