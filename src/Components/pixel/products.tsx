'use client'

import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Reveal, RevealItem } from './reveal'
import { SectionHeading } from './section-heading'
import { CtaLink } from './cta-link'

const products = [
  {
    title: '8x8 Square Book',
    copy: 'Perfect for everyday moments, trip highlights, and short stories.',
    price: 'From $19.99',
    href: '/photo-book/?size=8x8',
    image: '/images/choose_your_size_1.webp',
    badge: 'Popular',
    span: 'lg:col-span-4',
    maxW: 'max-w-[240px]',
  },
  {
    title: '10x10 Square Book',
    copy: 'Our most popular size for all of life’s big moments and family albums.',
    price: 'From $29.99',
    href: '/photo-book/?size=10x10',
    image: '/images/choose_your_size_2.webp',
    badge: 'Most Popular',
    span: 'lg:col-span-4',
    maxW: 'max-w-[265px]',
  },
  {
    title: '12x12 Square Book',
    copy: 'More room for your favorite photos and unforgettable milestone memories.',
    price: 'From $39.99',
    href: '/photo-book/?size=12x12',
    image: '/images/choose_your_size_3.webp',
    badge: 'Deluxe',
    span: 'lg:col-span-4',
    maxW: 'max-w-[290px]',
  },
]

function ProductCard({ product }: { product: (typeof products)[number] }) {
  return (
    <div className="group relative flex flex-col items-center justify-between bg-transparent p-2 text-center transition-all duration-300">
      {/* Top Badge & Arrow Link */}
      <div className="flex w-full items-center justify-between px-2">
        {product.badge ? (
          <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent">
            {product.badge}
          </span>
        ) : (
          <div />
        )}
        <Link
          href={product.href}
          className="grid size-10 place-items-center rounded-full bg-card/80 text-foreground ring-1 ring-foreground/10 shadow-sm transition-all duration-300 group-hover:rotate-45 group-hover:bg-accent group-hover:text-accent-foreground"
        >
          <ArrowUpRight className="size-5" />
        </Link>
      </div>

      {/* Credit: Code forked from Paul Irish of Smashing Magazine */}
      <div className="panel__image panel__image--book my-6">
        <Link href={product.href} className="books__book__image">
          <div className={cn("books__book__img", product.maxW)}>
            <img
              src={product.image}
              alt={product.title}
              className="w-full object-contain"
            />
          </div>
        </Link>
      </div>

      {/* Product Information */}
      <div className="mt-2 flex w-full flex-col gap-1 text-center px-2">
        <div className="flex items-baseline justify-center gap-3">
          <h3 className="font-serif text-2xl font-medium md:text-3xl text-foreground">{product.title}</h3>
          <span className="shrink-0 text-sm font-semibold text-accent">{product.price}</span>
        </div>
        <p className="mx-auto max-w-xs text-sm text-muted-foreground">{product.copy}</p>
      </div>

      {/* Paul Irish Smashing Magazine CSS Rules */}
      <style jsx>{`
        .panel__image.panel__image--book {
          display: flex;
          justify-content: center;
          align-items: center;
          position: relative;
        }

        .books__book__image {
          position: relative;
          display: block;
          text-decoration: none;
        }

        .books__book__img {
          width: 100%;
          will-change: transform;
          transform-origin: 0 100%;
          transform: rotate(-10deg);
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
  return (
    <section id="products" aria-labelledby="products-title" className="scroll-mt-24 px-5 py-24 md:px-6 md:py-32 overflow-hidden">
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

        <Reveal className="mt-14 grid gap-8 md:gap-10 lg:grid-cols-12" staggerChildren={0.1}>
          {products.map((product) => (
            <RevealItem key={product.title} className={product.span}>
              <ProductCard product={product} />
            </RevealItem>
          ))}
        </Reveal>
      </div>
    </section>
  )
}
