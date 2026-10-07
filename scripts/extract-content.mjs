// One-off content extractor: pixovo.cms_page.json -> lib/content/*.json
//
// The CMS JSON stores each page as a full legacy HTML document (own <style>, header, footer, FontAwesome,
// absolute pixovo.com links). The redesigned pages need structure, not that markup, so this script pulls out:
//   articles.json  blog articles: meta, hero, body HTML (cleaned), CTA/FAQ placeholders, TOC, JSON-LD
//   legal.json     terms + privacy: numbered sections
//   faq.json       the FAQ page: categories -> Q/A
// Re-run after editing the JSON:  node scripts/extract-content.mjs
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..')
const pages = JSON.parse(fs.readFileSync(path.join(root, 'pixovo.cms_page.json'), 'utf8'))
const outDir = path.join(root, 'lib', 'content')
fs.mkdirSync(outDir, { recursive: true })

const report = []
const note = (m) => report.push(m)

// ---------- helpers ----------
const ENT = { '&amp;': '&', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ', '&rsquo;': '’', '&lsquo;': '‘', '&ldquo;': '“', '&rdquo;': '”', '&mdash;': '—', '&ndash;': '–', '&lt;': '<', '&gt;': '>' }
const decode = (s) => s.replace(/&[a-z#0-9]+;/gi, (m) => ENT[m] ?? m)
const text = (h) => decode(h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
const slugify = (s) => text(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

/** Index just past the closing tag that balances the `<tag` opening at `start`. */
function balanced(html, start, tag) {
  const open = new RegExp(`<${tag}\\b`, 'gi')
  const close = new RegExp(`</${tag}>`, 'gi')
  let depth = 0
  let i = start
  for (;;) {
    open.lastIndex = i
    close.lastIndex = i
    const o = open.exec(html)
    const c = close.exec(html)
    if (!c) return html.length
    if (o && o.index < c.index) {
      depth++
      i = o.index + 1
    } else {
      depth--
      i = c.index + c[0].length
      if (depth === 0) return i
    }
  }
}
function blocks(html, tag, classRe) {
  const out = []
  const re = new RegExp(`<${tag}\\b[^>]*class="[^"]*${classRe}[^"]*"[^>]*>`, 'g')
  let m
  while ((m = re.exec(html))) {
    const end = balanced(html, m.index, tag)
    out.push({ start: m.index, end, html: html.slice(m.index, end) })
    re.lastIndex = end
  }
  return out
}
const inner = (block, tag) => block.slice(block.indexOf('>') + 1, block.lastIndexOf(`</${tag}>`))

const publicImages = new Set(fs.readdirSync(path.join(root, 'public', 'images')))

// Price text in the originals predates the current catalog (lib/flow/catalog.ts: from $19.99 / $29.99 / $39.99).
function fixPrices(h, slug) {
  return h.replace(/\$12\.99/g, '$19.99').replace(/\$26\.99/g, '$39.99')
}

function fixLink(href) {
  if (/^(mailto:|tel:|#)/.test(href)) return href
  let h = href.replace(/^https?:\/\/(dev\.)?pixovo\.com/i, '')
  if (/^\/?blog(post\d*)?\.html/i.test(h)) return '/blog/'
  if (/\.html$/i.test(h)) return '/blog/'
  if (h === '' || h === '/') return '/'
  if (h.startsWith('/')) return h.endsWith('/') || h.includes('?') || h.includes('#') ? h : h + '/'
  return href // external
}

function cleanBody(h, slug) {
  let s = h
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<i\b[^>]*><\/i>/gi, '') // FontAwesome icons: the font is not loaded in the redesign
    .replace(/\sstyle="[^"]*"/gi, '')
    .replace(/\sonerror="[^"]*"/gi, '')
    .replace(/<h2[^>]*>\s*<\/h2>/gi, '') // stray empty headings in the source
  s = s.replace(/href="([^"]+)"/gi, (_, href) => `href="${fixLink(decode(href))}"`)
  // images: keep only if the file exists locally (several referenced images are missing from /public)
  s = s.replace(/<img\b[^>]*>/gi, (tag) => {
    const src = /src="([^"]+)"/i.exec(tag)?.[1] ?? ''
    const alt = /alt="([^"]*)"/i.exec(tag)?.[1] ?? ''
    const file = decodeURIComponent(src.split('?')[0].split('/').pop() ?? '')
    if (publicImages.has(file)) return `<img src="/images/${file}" alt="${alt}" loading="lazy">`
    note(`${slug}: dropped missing image ${file}`)
    return ''
  })
  s = s.replace(/<div class="art-inline-img">\s*<\/div>/gi, '')
  s = fixPrices(s, slug)
  // heading ids for the table of contents
  const headings = []
  s = s.replace(/<h2([^>]*)>([\s\S]*?)<\/h2>/gi, (_, attrs, body) => {
    const t = text(body)
    const id = slugify(t)
    headings.push({ id, text: t })
    return `<h2${attrs} id="${id}">${body}</h2>`
  })
  s = s.replace(/class="([^"]*)"/g, (_, c) => `class="${c.split(/\s+/).filter((x) => !/^fa-/.test(x)).join(' ')}"`)
  return { html: s.trim(), headings }
}

function parseFaq(html) {
  const out = []
  for (const d of blocks(html, 'details', '(faq-card|faq-item)')) {
    const q = /<(?:span class="faq-q-text"|summary[^>]*)>([\s\S]*?)<\/(?:span|summary)>/i.exec(d.html)
    const qText = q ? text(/faq-q-text/.test(d.html) ? /class="faq-q-text">([\s\S]*?)<\/span>/i.exec(d.html)[1] : q[1]) : ''
    const a = /<div class="(?:faq-card-body|faq-a)">([\s\S]*?)<\/div>\s*<\/details>/i.exec(d.html)
    if (qText && a) out.push({ q: qText, a: a[1].trim() })
  }
  return out
}

const stripAll = (h) => h.replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<script(?![^>]*ld\+json)[\s\S]*?<\/script>/gi, '')

// ---------- blog articles ----------
const articles = []
for (const p of pages) {
  if (!p.content || !p.content.includes('art-body-inner')) continue
  const html = stripAll(p.content)
  const jsonLd = [...p.content.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)]
    .map((m) => {
      try {
        return JSON.parse(m[1])
      } catch {
        note(`${p.slug}: unparsable JSON-LD skipped`)
        return null
      }
    })
    .filter(Boolean)

  const title = text(/<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(html)?.[1] ?? p.title).replace(/\s*testing\s*$/i, '')
  const tag = text(/class="tag"[^>]*>([\s\S]*?)<\/span>/i.exec(html)?.[1] ?? 'Guides')
  const metaSpans = [...(/class="art-meta">([\s\S]*?)<\/div>/i.exec(html)?.[1] ?? '').matchAll(/<span(?![^>]*(?:avatar|dot))[^>]*>([\s\S]*?)<\/span>/gi)].map((m) => text(m[1])).filter(Boolean)
  const hero = /class="art-hero-img"[\s\S]*?<img[^>]*src="([^"]+)"[^>]*alt="([^"]*)"/i.exec(html)
  const heroFile = hero ? decodeURIComponent(hero[1].split('?')[0].split('/').pop()) : ''

  const start = html.indexOf('<div class="art-body-inner"')
  const bodyBlock = html.slice(start, balanced(html, start, 'div'))
  let body = inner(bodyBlock, 'div')

  // pull mid-article CTAs and the FAQ accordion out of the body so the redesign can render them natively
  const parts = []
  const marks = []
  for (const b of blocks(body, 'div', 'mid-cta(?![-\\w])')) {
    marks.push({ ...b, kind: 'cta', cta: { title: text(/<h4[^>]*>([\s\S]*?)<\/h4>/i.exec(b.html)?.[1] ?? ''), text: text(/<p[^>]*>([\s\S]*?)<\/p>/i.exec(b.html)?.[1] ?? '') } })
  }
  const accordion = blocks(body, 'div', 'faq-accordion')[0]
  if (accordion) marks.push({ ...accordion, kind: 'faq' })
  marks.sort((a, b) => a.start - b.start)
  let cursor = 0
  const faq = accordion ? parseFaq(accordion.html) : parseFaq(body)
  let faqHeading = ''
  for (const m of marks) {
    parts.push({ type: 'html', html: body.slice(cursor, m.start) })
    parts.push(m.kind === 'cta' ? { type: 'cta', ...m.cta } : { type: 'faq' })
    cursor = m.end
  }
  parts.push({ type: 'html', html: body.slice(cursor) })

  const headings = []
  const cleanedParts = parts
    .map((pt) => {
      if (pt.type !== 'html') return pt
      const c = cleanBody(pt.html, p.slug)
      headings.push(...c.headings)
      return { type: 'html', html: c.html }
    })
    .filter((pt) => pt.type !== 'html' || pt.html.replace(/<[^>]+>/g, '').trim() || /<(img|table)/.test(pt.html))

  const words = text(body).split(' ').length
  const seo = p.draft_seo ?? {}
  articles.push({
    slug: p.slug,
    title,
    tag,
    author: metaSpans[0] ?? 'Pixovo Team',
    dateLabel: metaSpans[1] ?? '',
    createdAt: p.created_at?.$date ?? p.created_at ?? null,
    updatedAt: p.updated_at?.$date ?? p.updated_at ?? null,
    metaTitle: (p.meta_title || seo.meta_title || title).replace(/\s*testing\s*$/i, ''),
    metaDescription: p.meta_description || seo.meta_description || '',
    ogImage: p.og_image || '',
    subtitle: /placeholder|Create your photobook in 3 easy steps/i.test(p.subtitle ?? '') || p.subtitle === p.meta_title ? '' : (p.subtitle ?? ''),
    heroImage: heroFile && publicImages.has(heroFile) ? `/images/${heroFile}` : '',
    heroAlt: hero?.[2] ?? title,
    parts: cleanedParts,
    faq: faq.map((f) => ({ q: f.q, a: cleanBody(f.a, p.slug).html })),
    headings,
    words,
    readMinutes: Math.max(1, Math.round(words / 210)),
    jsonLd,
  })
  if (heroFile && !publicImages.has(heroFile)) note(`${p.slug}: hero image ${heroFile} missing from public/images`)
}

// ---------- legal ----------
const legal = []
for (const slug of ['terms', 'privacy-policy']) {
  const p = pages.find((x) => x.slug === slug)
  const html = stripAll(p.content)
  const intro = text(/<section class="hero">[\s\S]*?<h1[^>]*>[\s\S]*?<\/h1>\s*<p>([\s\S]*?)<\/p>/i.exec(html)?.[1] ?? '')
  const cards = blocks(html, 'div', '(term-card|policy-card)')
  const sections = cards
    .map((c, i) => {
      const h2 = /<h2[^>]*>([\s\S]*?)<\/h2>/i.exec(c.html)
      if (!h2) return null
      const bodyHtml = c.html.slice(c.html.indexOf('</h2>') + 5)
      const cleaned = cleanBody(bodyHtml.replace(/<\/div>\s*<\/div>\s*$/i, ''), slug).html
      return { n: i + 1, id: slugify(h2[1]), title: text(h2[1]), html: cleaned }
    })
    .filter(Boolean)
  legal.push({
    slug,
    title: slug === 'terms' ? 'Terms & Conditions' : 'Privacy Policy',
    intro,
    metaTitle: p.meta_title || p.draft_seo?.meta_title || '',
    metaDescription: p.meta_description || p.draft_seo?.meta_description || '',
    updatedAt: p.updated_at?.$date ?? p.updated_at ?? null,
    sections,
  })
}

// ---------- faq ----------
const faqPage = pages.find((x) => x.slug === 'faq')
const faqHtml = stripAll(faqPage.content)
const groups = blocks(faqHtml, 'div', 'faq-group').map((b) => {
  const title = text(/<h2[^>]*>([\s\S]*?)<\/h2>/i.exec(b.html)?.[1] ?? '')
  const id = /id="([^"]+)"/i.exec(b.html)?.[1] ?? slugify(title)
  return { id, title, items: parseFaq(b.html).map((f) => ({ q: f.q, a: cleanBody(f.a, 'faq').html })) }
})
if (!groups.length) note('faq: no .faq-group blocks found: check the markup')
const helpHtml = stripAll(pages.find((x) => x.slug === 'help-center').content)
const helpGroups = blocks(helpHtml, 'div', 'faq-group').map((b) => ({
  id: /id="([^"]+)"/i.exec(b.html)?.[1] ?? '',
  title: text(/<h3[^>]*>([\s\S]*?)<\/h3>/i.exec(b.html)?.[1] ?? ''),
  items: parseFaq(b.html).map((f) => ({ q: f.q, a: cleanBody(f.a, 'help-center').html })),
}))
const photobookFaq = parseFaq(stripAll(pages.find((x) => x.slug === 'photobook').content)).map((f) => ({
  q: f.q,
  a: cleanBody(f.a, 'photobook').html,
}))
console.log(`help-center: ${helpGroups.length} groups, ${helpGroups.reduce((n, g) => n + g.items.length, 0)} questions; photobook faq: ${photobookFaq.length}`)
const faq = {
  title: 'Frequently Asked Questions',
  metaTitle: faqPage.meta_title || '',
  metaDescription: faqPage.meta_description || '',
  groups,
  helpGroups,
  photobookFaq,
}

fs.writeFileSync(path.join(outDir, 'articles.json'), JSON.stringify(articles, null, 1))
fs.writeFileSync(path.join(outDir, 'legal.json'), JSON.stringify(legal, null, 1))
fs.writeFileSync(path.join(outDir, 'faq.json'), JSON.stringify(faq, null, 1))

console.log(`articles: ${articles.length}`)
for (const a of articles) console.log(`  ${a.slug}: ${a.words}w, ${a.headings.length} h2, ${a.faq.length} faq, ${a.parts.filter((x) => x.type === 'cta').length} cta, hero=${a.heroImage || 'NONE'}`)
for (const l of legal) console.log(`legal ${l.slug}: ${l.sections.length} sections`)
console.log(`faq: ${groups.length} groups, ${groups.reduce((n, g) => n + g.items.length, 0)} questions`)
console.log('\nnotes:\n' + report.join('\n'))
