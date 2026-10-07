'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Calendar, FileText } from 'lucide-react'
import { SiteNav } from '@/components/pixel/site-nav'
import { SiteFooter } from '@/components/pixel/final-cta'
import { blogPosts } from '@/lib/blog-data'

export default function BlogTextPage() {
  return (
    <>
      <SiteNav />
      <main className="min-h-screen bg-background pt-36 pb-20 px-5 md:px-6">
        <div className="mx-auto max-w-6xl">
          <header className="mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-accent">Category</span>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mt-1">
              Text Articles & Stories
            </h1>
            <p className="mt-2 text-base text-muted-foreground max-w-xl">
              In-depth articles, photography guides, and customer story highlights.
            </p>
          </header>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {blogPosts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}/`}
                className="group flex flex-col overflow-hidden rounded-3xl bg-card border border-foreground/10 shadow-xs transition-all duration-300 hover:shadow-float hover:border-foreground/20 hover:-translate-y-1"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                  <Image src={post.image} alt={post.title} fill className="object-cover group-hover:scale-105 transition-transform" />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-2">
                    <span className="text-accent font-semibold flex items-center gap-1">
                      <FileText className="size-3" /> Article
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3" /> {post.date}
                    </span>
                  </div>
                  <h3 className="font-serif text-lg font-bold text-foreground group-hover:text-accent transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{post.summary}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
