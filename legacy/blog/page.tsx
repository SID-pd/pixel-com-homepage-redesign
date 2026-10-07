'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Calendar, Heart, Search, Sparkles, Wand2 } from 'lucide-react'
import { SiteNav } from '@/components/pixel/site-nav'
import { SiteFooter } from '@/components/pixel/final-cta'
import { blogPosts, type BlogPost } from '@/lib/blog-data'

const categories = ['All', 'Guides', 'Tips & Tricks', 'Inspiration', 'Product Updates']

export default function BlogHubPage() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredPosts = useMemo(() => {
    return blogPosts.filter((post) => {
      const matchesCategory =
        activeCategory === 'All' || post.category === activeCategory
      const matchesQuery =
        searchQuery.trim() === '' ||
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.summary.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCategory && matchesQuery
    })
  }, [activeCategory, searchQuery])

  return (
    <>
      <SiteNav />
      <main className="min-h-screen bg-background pt-32 pb-20">
        {/* Blog Hero Banner */}
        <section className="relative overflow-hidden px-5 py-12 md:py-16 text-center">
          {/* Decorative Glow Circles */}
          <div aria-hidden className="pointer-events-none absolute -left-12 -top-12 size-64 rounded-full bg-accent/10 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute right-10 top-20 size-72 rounded-full bg-amber-500/10 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute left-1/3 bottom-0 size-80 rounded-full bg-emerald-500/10 blur-3xl" />

          <div className="relative mx-auto max-w-4xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-accent mb-4">
              <Sparkles className="size-3.5" />
              Pixovo Journal
            </span>
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground">
              Blogs
            </h1>
            <p className="mt-3 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Guides, tips, and real ideas for making a photo book you’ll actually finish, from AI design basics to occasion inspiration.
            </p>

            {/* Blog Search Input */}
            <div className="mt-8 mx-auto max-w-md relative flex items-center">
              <Search className="absolute left-4 size-5 text-muted-foreground pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles..."
                className="w-full rounded-full border border-foreground/10 bg-card pl-11 pr-5 py-3 text-sm text-foreground shadow-sm focus:outline-2 focus:outline-accent placeholder:text-muted-foreground/70"
              />
            </div>
          </div>
        </section>

        {/* Section Heading */}
        <div className="mx-auto max-w-6xl px-5 mt-6 mb-6">
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground">
            Latest Blogs
          </h2>
        </div>

        {/* Filter Bar */}
        <section className="mx-auto max-w-6xl px-5 mb-10 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 pb-2">
            {categories.map((cat) => {
              const isActive = activeCategory === cat
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold tracking-wide transition-all duration-300 shrink-0 ${
                    isActive
                      ? 'bg-ink text-ink-foreground shadow-sm'
                      : 'bg-card text-foreground/70 border border-foreground/10 hover:bg-foreground/5 hover:text-foreground'
                  }`}
                >
                  {cat}
                </button>
              )
            })}
          </div>
        </section>

        {/* Blog Posts Grid */}
        <section className="mx-auto max-w-6xl px-5">
          {filteredPosts.length === 0 ? (
            <div className="rounded-3xl border border-dashed p-12 text-center">
              <p className="text-muted-foreground">No blog posts found matching your search or category filter.</p>
              <button
                type="button"
                onClick={() => {
                  setActiveCategory('All')
                  setSearchQuery('')
                }}
                className="mt-4 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-accent-foreground"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}/`}
                  className="group flex flex-col overflow-hidden rounded-3xl bg-card border border-foreground/10 shadow-xs transition-all duration-300 hover:shadow-float hover:border-foreground/20 hover:-translate-y-1"
                >
                  {/* Card Image */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                    <Image
                      src={post.image}
                      alt={post.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>

                  {/* Card Content */}
                  <div className="flex flex-1 flex-col p-5">
                    {/* Meta Row: Category Badge & Date */}
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-2.5 font-medium">
                      <span className="inline-flex items-center gap-1 text-accent font-semibold">
                        {post.category === 'Guides' ? (
                          <Wand2 className="size-3" />
                        ) : (
                          <Heart className="size-3 fill-accent/20" />
                        )}
                        {post.category}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3" />
                        {post.date}
                      </span>
                    </div>

                    {/* Post Title */}
                    <h3 className="font-serif text-lg font-bold text-foreground leading-snug tracking-tight group-hover:text-accent transition-colors line-clamp-2">
                      {post.title}
                    </h3>

                    <p className="mt-2 text-xs text-muted-foreground line-clamp-2 leading-relaxed font-normal">
                      {post.summary}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
