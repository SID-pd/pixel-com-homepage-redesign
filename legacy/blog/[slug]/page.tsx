'use client'

import { use } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft,
  Calendar,
  Clock,
  Heart,
  HelpCircle,
  ShieldAlert,
  Sparkles,
  User,
  Wand2,
  CheckCircle2,
} from 'lucide-react'
import { SiteNav } from '@/components/pixel/site-nav'
import { SiteFooter } from '@/components/pixel/final-cta'
import { CtaLink } from '@/components/pixel/cta-link'
import { blogPosts } from '@/lib/blog-data'

export default function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)
  const post = blogPosts.find((p) => p.slug === slug) || blogPosts[0]

  return (
    <>
      <SiteNav />
      <main className="min-h-screen bg-background pt-32 pb-20 px-5 md:px-6">
        <article className="mx-auto max-w-4xl">
          {/* Breadcrumb */}
          <Link
            href="/blog/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="size-3.5" />
            Back to All Blogs
          </Link>

          {/* Article Header */}
          <header className="mb-8">
            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3 font-medium">
              <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-3 py-1 text-xs font-bold text-accent">
                {post.category}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="size-3.5" />
                {post.date}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="size-3.5" />
                {post.readTime}
              </span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-tight">
              {post.title}
            </h1>
            {post.subtitle && (
              <p className="mt-3 text-lg text-muted-foreground leading-relaxed">
                {post.subtitle}
              </p>
            )}

            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <User className="size-3.5 text-accent" />
              <span>Written by <strong className="text-foreground">{post.author}</strong></span>
            </div>
          </header>

          {/* Featured Hero Image */}
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-3xl bg-neutral-100 dark:bg-neutral-800 shadow-md mb-10">
            <Image
              src={post.image}
              alt={post.title}
              fill
              priority
              sizes="(max-width: 1200px) 100vw, 896px"
              className="object-cover"
            />
          </div>

          {/* Executive Summary Card */}
          <div className="rounded-3xl border border-accent/20 bg-accent/5 p-6 md:p-8 mb-10 shadow-xs">
            <div className="flex items-center gap-2 text-accent text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="size-4" />
              <span>Key Takeaway & Quick Summary</span>
            </div>
            <p className="text-sm md:text-base text-foreground font-medium leading-relaxed">
              {post.summary}
            </p>
          </div>

          {/* Article Main Body Content */}
          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
            {post.content?.sections ? (
              post.content.sections.map((section, idx) => (
                <div key={idx} className="flex flex-col gap-3">
                  <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                    {section.title}
                  </h2>
                  <p className="text-sm md:text-base leading-relaxed text-muted-foreground">
                    {section.body}
                  </p>

                  {section.bullets && (
                    <ul className="my-2 space-y-2 pl-2">
                      {section.bullets.map((bullet, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-foreground">
                          <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {section.callout && (
                    <div className="my-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5">
                      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-sm mb-1">
                        <ShieldAlert className="size-4" />
                        <span>{section.callout.title}</span>
                      </div>
                      <p className="text-xs md:text-sm text-amber-900/80 dark:text-amber-200/80 leading-relaxed">
                        {section.callout.text}
                      </p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="flex flex-col gap-4 text-sm text-muted-foreground leading-relaxed">
                <p>
                  Creating a photo book is one of the most rewarding ways to preserve your favorite moments, from family vacations to milestone celebrations. At Pixovo, our direct-from-factory manufacturing ensures 100% archival quality prints at 50% lower prices than traditional photo book services.
                </p>
                <p>
                  With our smart AI layout tool, you can generate balanced spreads from your uploaded phone captures in under 60 seconds, custom preview each spread, and order with 3-5 day turnaround anywhere in the USA.
                </p>
              </div>
            )}

            {/* Optional Comparison Table */}
            {post.content?.comparisonTable && (
              <div className="my-8 overflow-hidden rounded-2xl border border-foreground/10 shadow-xs">
                <div className="bg-neutral-900 text-white p-4 font-bold text-xs uppercase tracking-wider">
                  Pixovo Size Comparison Chart
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs md:text-sm">
                    <thead className="border-b bg-card text-foreground font-semibold">
                      <tr>
                        {post.content.comparisonTable.headers.map((h, i) => (
                          <th key={i} className="p-3.5">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-foreground/5 bg-background">
                      {post.content.comparisonTable.rows.map((row, i) => (
                        <tr key={i} className="hover:bg-foreground/[0.02]">
                          {row.map((cell, j) => (
                            <td key={j} className="p-3.5 font-medium text-foreground">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Promotional Mid-Article CTA Banner */}
          <div className="mt-12 rounded-3xl bg-neutral-950 p-8 text-neutral-100 shadow-float border border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col gap-1 text-center md:text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-accent">Limited Time Offer</span>
              <h3 className="font-serif text-2xl md:text-3xl font-bold text-white">
                Claim 50% OFF Your Pixovo Photo Book
              </h3>
              <p className="text-xs md:text-sm text-neutral-300">
                Direct from our California factory. Starting at just $19.99 ($39.99 standard).
              </p>
            </div>
            <CtaLink href="/photo-book/" size="lg" showArrow={false} className="shrink-0">
              Start Designing Now
            </CtaLink>
          </div>

          {/* FAQ Accordion Section */}
          {post.content?.faqs && post.content.faqs.length > 0 && (
            <div className="mt-14 border-t pt-10">
              <h3 className="font-serif text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                <HelpCircle className="size-5 text-accent" />
                <span>Frequently Asked Questions</span>
              </h3>
              <div className="space-y-4">
                {post.content.faqs.map((faq, idx) => (
                  <div key={idx} className="rounded-2xl bg-card p-5 border border-foreground/10 shadow-xs">
                    <h4 className="font-semibold text-sm md:text-base text-foreground mb-2">
                      {faq.question}
                    </h4>
                    <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related Articles Footer */}
          <div className="mt-16 border-t pt-10">
            <h3 className="font-serif text-2xl font-bold text-foreground mb-6">
              More Recommended Articles
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {blogPosts
                .filter((p) => p.slug !== post.slug)
                .slice(0, 2)
                .map((rel) => (
                  <Link
                    key={rel.id}
                    href={`/blog/${rel.slug}/`}
                    className="group flex gap-4 rounded-2xl bg-card p-4 border border-foreground/10 shadow-xs transition-all hover:shadow-md hover:border-foreground/20"
                  >
                    <div className="relative aspect-square size-20 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                      <Image src={rel.image} alt={rel.title} fill className="object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    <div className="flex flex-col justify-center">
                      <span className="text-[10px] font-bold uppercase text-accent">{rel.category}</span>
                      <h4 className="font-serif text-sm font-bold text-foreground group-hover:text-accent transition-colors line-clamp-2 mt-0.5">
                        {rel.title}
                      </h4>
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        </article>
      </main>
      <SiteFooter />
    </>
  )
}
