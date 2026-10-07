import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ArticleView } from '@/components/content/article-view'
import { articles, getArticle } from '@/lib/content'
import { coverOf } from '@/lib/content/blog'

type Props = { params: Promise<{ slug: string }> }

export const dynamicParams = false

export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const a = getArticle(slug)
  if (!a) return {}
  return {
    title: a.metaTitle,
    description: a.metaDescription,
    alternates: { canonical: `/blog/${a.slug}/` },
    openGraph: {
      type: 'article',
      title: a.metaTitle,
      description: a.metaDescription,
      images: [a.ogImage || coverOf(a)],
      publishedTime: a.createdAt ?? undefined,
      modifiedTime: a.updatedAt ?? undefined,
    },
  }
}

export default async function BlogArticlePage({ params }: Props) {
  const { slug } = await params
  const article = getArticle(slug)
  if (!article) notFound()
  return <ArticleView article={article} />
}
