'use client'

import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Reveal, RevealItem } from './reveal'
import { SectionHeading } from './section-heading'
import { CtaLink } from './cta-link'
import { money, salePrice, type Campaign } from '@/lib/flow/catalog'
import { unitPrice } from '@/lib/flow/pricing'
import { useCampaign } from '@/lib/flow/use-campaign'

const products = [
  {
    size: '8x8' as const,
    title: '8x8 Square Book',
    copy: 'Perfect for everyday moments, trip highlights, and short stories.',
    href: '/photo-book/?size=8x8',
    image: '/images/choose_your_size_1.webp',
    badge: 'Popular',
    span: 'lg:col-span-4',
    maxW: 'max-w-[230px]',
  },
  {
    size: '10x10' as const,
    title: '10x10 Square Book',
    copy: 'Our most popular size for all of life’s big moments and family albums.',
    href: '/photo-book/?size=10x10',
    image: '/images/choose_your_size_2.webp',
    badge: 'Most Popular',
    span: 'lg:col-span-4',
    maxW: 'max-w-[255px]',
  },
  {
    size: '12x12' as const,
    title: '12x12 Square Book',
    copy: 'More room for your favorite photos and unforgettable milestone memories.',
    href: '/photo-book/?size=12x12',
    image: '/images/choose_your_size_3.webp',
    badge: 'Deluxe',
    span: 'lg:col-span-4',
    maxW: 'max-w-[280px]',
  },
]

function ProductCard({ product, campaign }: { product: (typeof products)[number]; campaign: Campaign | null }) {
  // List price always; the sale price only while a campaign is running, and the link carries its code so the price shown is the price paid.
  const list = unitPrice({ size: product.size, pages: 20, cover: 'softcover' })
  const sale = campaign ? salePrice(list, campaign.percent) : null
  const href = campaign ? `${product.href}&promo=${campaign.code}` : product.href
  return (
    <div className="group relative flex h-full flex-col items-center justify-between rounded-3xl bg-card/50 p-5 border border-foreground/[0.08] text-center shadow-xs transition-all duration-300 hover:shadow-float hover:border-foreground/15 hover:-translate-y-1">
      {/* Top Badge & Arrow Link */}
      <div className="flex h-9 w-full items-center justify-between">
        {product.badge ? (
          <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent">
            {product.badge}
          </span>
        ) : (
          <span />
        )}
        <Link
          href={href}
          aria-label={`Configure ${product.title}`}
          className="grid size-9 place-items-center rounded-full bg-background text-foreground ring-1 ring-foreground/10 shadow-xs transition-all duration-300 group-hover:rotate-45 group-hover:bg-accent group-hover:text-accent-foreground"
        >
          <ArrowUpRight className="size-4.5" />
        </Link>
      </div>

      {/* Book Graphic Container with Equal Height */}
      <div className="panel__image panel__image--book my-4 flex h-60 w-full items-center justify-center">
        <Link href={href} className="books__book__image flex items-center justify-center w-full">
          <div className={cn("books__book__img mx-auto", product.maxW)}>
            <img
              src={product.image}
              alt={product.title}
              className="w-full object-contain max-h-52"
            />
          </div>
        </Link>
      </div>

      {/* Product Information - Aligned Levels */}
      <div className="mt-auto flex w-full flex-col items-center text-center gap-1.5 pt-2">
        <h3 className="font-serif text-2xl font-bold text-foreground tracking-tight">{product.title}</h3>
        
        {/* Pricing: list price, plus the sale price while a campaign is running */}
        <div className="flex items-center justify-center gap-2" aria-label={sale !== null ? `List price ${money(list)}, sale price ${money(sale)}` : `Price ${money(list)}`}>
          {sale !== null ? (
            <>
              <span className="text-xs text-muted-foreground line-through font-semibold">{money(list)}</span>
              <span className="text-lg font-bold text-accent">{money(sale)}</span>
              <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-extrabold text-emerald-600 border border-emerald-500/20">
                {campaign!.percent}% OFF
              </span>
            </>
          ) : (
            <span className="text-lg font-bold text-accent">from {money(list)}</span>
          )}
        </div>
        {campaign && <p className="text-[11px] text-muted-foreground">With code {campaign.code}, applied for you</p>}

        {/* Description Text */}
        <p className="max-w-xs text-xs sm:text-sm text-muted-foreground leading-relaxed font-normal min-h-[40px] flex items-center justify-center">
          {product.copy}
        </p>
      </div>

      {/* CSS Rules for Book Shadow & Hover Rotate */}
      <style jsx>{`
        .panel__image.panel__image--book {
          position: relative;
        }

        .books__book__image {
          position: relative;
          display: block;
          text-decoration: none;
        }

        .books__book__img {
          will-change: transform;
          transform-origin: 0 100%;
          transform: rotate(-8deg);
          transition: transform 0.3s ease-out;
        }

        .books__book__img:hover,
        .group:hover .books__book__img {
          transform: rotate(0deg);
        }

        .books__book__image::before {
          display: block;
          content: '';
          height: 20%;
          width: 45%;
          position: absolute;
          background-image: url(https://i.imgur.com/5udcDlp.png);
          background-size: 100% auto;
          background-repeat: no-repeat;
          top: 84%;
          left: 35%;
          right: 0;
          transition: all 0.2s ease-out;
          transform-origin: 30% 50%;
          pointer-events: none;
        }

        .group:hover .books__book__image::before {
          transform: scale(1.1);
        }
      `}</style>
    </div>
  )
}

export function Products() {
  const campaign = useCampaign()
  return (
    <section id="products" aria-labelledby="products-title" className="scroll-mt-24 px-5 py-10 md:px-6 md:py-16 overflow-hidden">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Choose Your Size"
          title={
            <span id="products-title">
              Three square sizes. <em className="text-accent">Endless memories.</em>
            </span>
          }
          description="Custom square photo books designed automatically in minutes from your uploaded photos, printed and shipped from the USA."
          action={
            <CtaLink href="/photo-book/" variant="secondary" showArrow>
              Create Photo Book
            </CtaLink>
          }
        />

        <Reveal className="mt-12 grid gap-6 md:gap-8 lg:grid-cols-12" staggerChildren={0.1}>
          {products.map((product) => (
            <RevealItem key={product.title} className={product.span}>
              <ProductCard product={product} campaign={campaign} />
            </RevealItem>
          ))}
        </Reveal>
      </div>
    </section>
  )
}
