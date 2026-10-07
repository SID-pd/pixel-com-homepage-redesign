import { allCards, TOPICS } from '@/lib/content/blog'
import { CtaBand, MarketingShell, PageHero } from './blocks'
import { BlogBrowser, FeaturedPost } from './blog-ui'

export function BlogCollection({
  eyebrow = 'The Pixovo blog',
  title,
  description,
  topic = 'All',
  featured = false,
}: {
  eyebrow?: string
  title: React.ReactNode
  description: string
  topic?: string
  featured?: boolean
}) {
  const posts = allCards()
  const scoped = topic === 'All' ? posts : posts.filter((p) => p.topic === topic)
  const [first, ...rest] = scoped
  return (
    <MarketingShell>
      <PageHero eyebrow={eyebrow} title={title} description={description} />
      <section className="px-5 pb-16 md:px-6 md:pb-24">
        <div className="mx-auto max-w-6xl space-y-10">
          {featured && first && <FeaturedPost post={first} />}
          <BlogBrowser posts={featured ? rest : scoped} topics={topic === 'All' ? TOPICS : []} />
        </div>
      </section>
      <CtaBand title="Your photos deserve more than a camera roll" />
    </MarketingShell>
  )
}
