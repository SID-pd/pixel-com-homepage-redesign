'use client'

import { useMemo } from 'react'
import { SiteNav } from './site-nav'
import { SiteFooter } from './final-cta'
import { getCmsPageBySlug } from '@/lib/cms'

export function CmsPageRender({ slug }: { slug: string }) {
  const pageData = getCmsPageBySlug(slug)

  const { styleContent, bodyContent } = useMemo(() => {
    if (!pageData || !pageData.content) {
      return { styleContent: '', bodyContent: '' }
    }

    const rawHtml = pageData.content

    // Extract all <style> blocks
    const styleMatches = rawHtml.match(/<style[\s\S]*?>([\s\S]*?)<\/style>/gi)
    let styles = ''
    if (styleMatches) {
      styles = styleMatches
        .map((s) => s.replace(/<\/?style[\s\S]*?>/gi, ''))
        .join('\n')
    }

    // Extract <body> content or fallback to full html
    let body = rawHtml
    const bodyMatch = rawHtml.match(/<body[\s\S]*?>([\s\S]*?)<\/body>/i)
    if (bodyMatch) {
      body = bodyMatch[1]
    }

    // Remove breadcrumb navigation elements (Home / Blog / Title)
    body = body
      .replace(/<nav[^>]*class="[^"]*(crumb|breadcrumb)[^"]*"[\s\S]*?<\/nav>/gi, '')
      .replace(/<div[^>]*class="[^"]*(crumb|breadcrumb)[^"]*"[\s\S]*?<\/div>/gi, '')
      .replace(/<ol[^>]*class="[^"]*(crumb|breadcrumb)[^"]*"[\s\S]*?<\/ol>/gi, '')
      .replace(/<ul[^>]*class="[^"]*(crumb|breadcrumb)[^"]*"[\s\S]*?<\/ul>/gi, '')

    // Remove legacy top banners, factory direct bars, headers, and footers (tags, classes, IDs)
    body = body
      .replace(/<header[\s\S]*?<\/header>/gi, '')
      .replace(/<footer[\s\S]*?<\/footer>/gi, '')
      .replace(/<nav[\s\S]*?<\/nav>/gi, '')
      .replace(/<div[^>]*class="[^"]*(art-footer|site-header|site-footer|main-header|main-footer|topbar|announcement|navbar|quicknav|factory-bar|top-bar)[^"]*"[\s\S]*?<\/div>/gi, '')
      .replace(/<section[^>]*class="[^"]*(header|footer|navbar|top-bar|factory-banner)[^"]*"[\s\S]*?<\/section>/gi, '')
      .replace(/<div[^>]*>[\s]*Factory Direct[\s\S]*?Precision Manufacturing[\s\S]*?<\/div>/gi, '')

    // Sanitize SVGs: fix missing viewBox, empty paths, and make SVGs responsive
    body = body.replace(/<svg([\s\S]*?)>([\s\S]*?)<\/svg>/gi, (match, attrs, inner) => {
      let updatedAttrs = attrs
      if (!/viewBox=/i.test(updatedAttrs)) {
        const wMatch = updatedAttrs.match(/width=["'](\d+)["']/i)
        const hMatch = updatedAttrs.match(/height=["'](\d+)["']/i)
        const w = wMatch ? wMatch[1] : '24'
        const h = hMatch ? hMatch[1] : '24'
        updatedAttrs += ` viewBox="0 0 ${w} ${h}"`
      }
      // Remove empty d="" attributes inside svg paths
      const cleanedInner = inner.replace(/d=["']\s*["']/gi, '')
      return `<svg${updatedAttrs}>${cleanedInner}</svg>`
    })

    return { styleContent: styles, bodyContent: body }
  }, [pageData])

  if (!pageData) {
    return (
      <>
        <SiteNav />
        <main className="min-h-screen pt-36 pb-20 px-6 text-center">
          <h1 className="text-3xl font-serif font-bold text-foreground mb-4">Page Not Found</h1>
          <p className="text-muted-foreground">The requested page "{slug}" could not be found.</p>
        </main>
        <SiteFooter />
      </>
    )
  }

  return (
    <>
      <SiteNav />
      <main className="min-h-screen pt-36 sm:pt-44 pb-20 md:pb-28 bg-background">
        <style
          dangerouslySetInnerHTML={{
            __html: `
              .cms-wrapper { 
                width: 100%; 
                overflow-x: hidden;
                --teal: #59b0c1;
                --navy: #1e293b;
                --coral: #d88591;
                --amber: #f59e0b;
                --yellow: #fde489;
                --green: #10b981;
                --muted: #64748b;
                --border: rgba(0,0,0,0.1);
                --bg: #ffffff;
                --text: #0f172a;
                --soft-gray: #f8fafc;
                --pastel-pink: #fce7f3;
                --pastel-blue: #e0f2fe;
                --pastel-teal: #ccfbf1;
                --pastel-green: #dcfce7;
                --pastel-yellow: #fef9c3;
                --cream: #faf7f2;
                --demo-cream: #faf7f2;
                --demo-navy: #1e293b;
                --demo-teal: #59b0c1;
                --demo-white: #ffffff;
                --demo-border: rgba(0,0,0,0.1);
                --demo-muted: #64748b;
                --demo-coral: #e11d48;
                --demo-yellow: #eab308;
                --demo-green: #10b981;
              }
              .cms-wrapper header, 
              .cms-wrapper footer, 
              .cms-wrapper nav, 
              .cms-wrapper .crumb,
              .cms-wrapper .crumb-inner,
              .cms-wrapper .breadcrumb,
              .cms-wrapper .breadcrumbs,
              .cms-wrapper .art-footer, 
              .cms-wrapper .site-header, 
              .cms-wrapper .site-footer,
              .cms-wrapper .main-header,
              .cms-wrapper .main-footer,
              .cms-wrapper .topbar,
              .cms-wrapper .top-bar,
              .cms-wrapper .announcement-bar,
              .cms-wrapper .factory-bar,
              .cms-wrapper .factory-banner,
              .cms-wrapper .navbar,
              .cms-wrapper #header,
              .cms-wrapper #footer { 
                display: none !important; 
              }
              .cms-wrapper h1, .cms-wrapper h2 { scroll-margin-top: 140px; }
              .cms-wrapper svg { max-width: 100%; height: auto; vertical-align: middle; display: inline-block; }
            `,
          }}
        />
        {styleContent && <style dangerouslySetInnerHTML={{ __html: styleContent }} />}
        <div className="cms-container mx-auto max-w-6xl px-4 sm:px-6 md:px-8">
          <div
            className="cms-wrapper w-full"
            dangerouslySetInnerHTML={{ __html: bodyContent }}
          />
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
