'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Check, Clock, Link2, Search, Share2 } from 'lucide-react'
import type { PostCard } from '@/lib/content/blog'
import { cn } from '@/lib/utils'

export function PostCardView({ post, priority }: { post: PostCard; priority?: boolean }) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-3xl border border-foreground/8 bg-card transition duration-300 hover:-translate-y-1 hover:shadow-float">
      <div className="relative aspect-[16/10] overflow-hidden bg-secondary">
        <Image
          src={post.cover}
          alt=""
          fill
          priority={priority}
          sizes="(min-width:1024px) 380px, (min-width:640px) 50vw, 100vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />
        <span className="absolute left-4 top-4 rounded-full bg-background/90 px-3 py-1 text-xs font-semibold backdrop-blur">{post.topic}</span>
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <h3 className="text-balance font-serif text-2xl leading-snug tracking-tight">
          <Link href={`/blog/${post.slug}/`} className="after:absolute after:inset-0 focus-visible:outline-none">
            {post.title}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{post.summary}</p>
        <div className="mt-auto flex items-center justify-between pt-5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-3.5" /> {post.readMinutes} min read
          </span>
          <span className="inline-flex items-center gap-1 font-medium text-accent">
            Read <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </article>
  )
}

export function FeaturedPost({ post }: { post: PostCard }) {
  return (
    <article className="group relative grid overflow-hidden rounded-[2rem] border border-foreground/8 bg-card shadow-xs transition hover:shadow-float md:grid-cols-2">
      <div className="relative aspect-[16/11] bg-secondary md:aspect-auto md:min-h-[22rem]">
        <Image src={post.cover} alt="" fill priority sizes="(min-width:768px) 560px, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
      </div>
      <div className="flex flex-col justify-center p-6 sm:p-10">
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-accent/12 px-3 py-1 text-xs font-semibold text-accent">Featured · {post.topic}</span>
        <h2 className="mt-4 text-balance font-serif text-3xl leading-tight tracking-tight md:text-3xl">
          <Link href={`/blog/${post.slug}/`} className="after:absolute after:inset-0 focus-visible:outline-none">
            {post.title}
          </Link>
        </h2>
        <p className="mt-3 text-pretty text-muted-foreground">{post.summary}</p>
        <p className="mt-6 flex items-center gap-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-4" /> {post.readMinutes} min read
          </span>
          <span>{post.date}</span>
        </p>
      </div>
    </article>
  )
}

export function BlogBrowser({ posts, topics, initial = 'All' }: { posts: PostCard[]; topics: string[]; initial?: string }) {
  const [topic, setTopic] = useState(initial)
  const [q, setQ] = useState('')
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase()
    return posts.filter((p) => (topic === 'All' || p.topic === topic) && (!s || p.title.toLowerCase().includes(s) || p.summary.toLowerCase().includes(s)))
  }, [posts, topic, q])

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div role="tablist" aria-label="Topics" hidden={topics.length === 0} className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {['All', ...topics].map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={topic === t}
              onClick={() => setTopic(t)}
              className={cn('shrink-0 rounded-full px-4 py-2 text-sm font-medium transition', topic === t ? 'bg-foreground text-background' : 'bg-secondary text-foreground/75 hover:bg-foreground/10')}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="relative sm:w-72">
          <label htmlFor="blog-search" className="sr-only">
            Search articles
          </label>
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="blog-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search articles…"
            className="h-11 w-full rounded-full border border-foreground/10 bg-card pl-10 pr-4 text-sm outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/15"
          />
        </div>
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {shown.length} article{shown.length === 1 ? '' : 's'} shown
      </p>

      {shown.length === 0 ? (
        <p className="mt-10 rounded-3xl border border-dashed border-foreground/15 p-10 text-center text-muted-foreground">
          Nothing matches that yet. Try a different word, or{' '}
          <button type="button" onClick={() => { setQ(''); setTopic('All') }} className="font-medium text-accent underline-offset-4 hover:underline">
            see all articles
          </button>
          .
        </p>
      ) : (
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((p) => (
            <li key={p.slug} className="flex">
              <div className="w-full">
                <PostCardView post={p} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** Thin progress bar: gives long articles a sense of "how much is left", which lowers drop-off. */
export function ReadingProgress() {
  const [pct, setPct] = useState(0)
  useEffect(() => {
    const el = document.getElementById('article-body')
    if (!el) return
    const onScroll = () => {
      const r = el.getBoundingClientRect()
      const total = r.height - window.innerHeight * 0.6
      setPct(Math.max(0, Math.min(100, ((-r.top + window.innerHeight * 0.2) / total) * 100)))
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])
  return (
    <div aria-hidden className="fixed inset-x-0 top-0 z-[60] h-1 bg-transparent">
      <div className="h-full bg-accent transition-[width] duration-150" style={{ width: `${pct}%` }} />
    </div>
  )
}

export function ShareButtons({ title }: { title: string }) {
  const [copied, setCopied] = useState(false)
  const [canShare, setCanShare] = useState(false)
  useEffect(() => setCanShare(typeof navigator !== 'undefined' && !!navigator.share), [])
  const url = () => window.location.href.split('#')[0]
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url())
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
          } catch {
            /* clipboard blocked: nothing to do */
          }
        }}
        className="inline-flex h-10 items-center gap-2 rounded-full bg-secondary px-4 text-sm font-medium transition hover:bg-foreground/10"
      >
        {copied ? <Check className="size-4 text-accent" /> : <Link2 className="size-4" />} {copied ? 'Link copied' : 'Copy link'}
      </button>
      {canShare && (
        <button
          type="button"
          onClick={() => navigator.share({ title, url: url() }).catch(() => {})}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-secondary px-4 text-sm font-medium transition hover:bg-foreground/10"
        >
          <Share2 className="size-4" /> Share
        </button>
      )}
    </div>
  )
}
