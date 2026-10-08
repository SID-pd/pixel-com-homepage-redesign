import { allCards, TOPICS } from '@/lib/content/blog'
import { CtaBand, MarketingShell } from './blocks'
import { BlogBrowser } from './blog-ui'

export function BlogCollection({
  eyebrow = 'The Pixovo blog',
  title,
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
      <header className="px-5 pb-2 pt-28 md:px-6 md:pt-32">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">{eyebrow}</p>
          <h1 className="mt-1 font-serif text-3xl tracking-tight md:text-4xl">{title}</h1>
        </div>
      </header>
      <section className="px-5 pb-16 md:px-6 md:pb-24">
        <div className="mx-auto max-w-6xl space-y-10">
          <BlogBrowser posts={scoped} topics={topic === 'All' ? TOPICS : []} />
        </div>
      </section>
      <CtaBand title="Your photos deserve more than a camera roll" />
    </MarketingShell>
  )
}
