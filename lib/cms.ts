import cmsData from '@/pixovo.cms_page.json'

export interface CmsPageData {
  _id: { $oid: string }
  title: string
  slug: string
  subtitle?: string
  content: string
  meta_title?: string
  meta_description?: string
  meta_keywords?: string
}

export function getCmsPageBySlug(slug: string): CmsPageData | undefined {
  const page = (cmsData as CmsPageData[]).find((p) => p.slug === slug)
  if (!page) return undefined

  // Replace outdated pricing with $39.99 (50% OFF -> $19.99) pricing across all CMS pages
  let updatedContent = page.content
    .replace(/\$12\.99/g, '$19.99')
    .replace(/\$26\.99/g, '$39.99')
    .replace(/\$50–\$60/g, '$39.99–$79.99')

  return {
    ...page,
    content: updatedContent,
  }
}
