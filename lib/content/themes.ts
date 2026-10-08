// Theme / occasion landing pages (/themes/*). One record per page; app/themes/[slug]/page.tsx renders them.
// SEO notes: each page targets ONE primary keyword (in title, H1, URL, first paragraph) plus long-tail phrases that
// appear naturally in headings and FAQ. Copy stays inside the owner-agreed claims: no ratings, no competitor
// comparisons, delivery = ships in 3-5 business days, delivered in 5-10 working days, "love it or we'll make it right".
// Prices are never typed here; pages read them from lib/flow/catalog.ts.

export type Theme = {
  slug: string
  /** short label for nav, cards and breadcrumbs */
  nav: string
  /** page <title> (keep under ~60 chars) */
  metaTitle: string
  /** meta description (150-160 chars) */
  metaDescription: string
  primaryKeyword: string
  keywords: string[]
  eyebrow: string
  h1: [string, string]
  lead: string
  image: string
  imageAlt: string
  /** /photo-book/?template=<id> when a matching template exists */
  templateId?: string
  size: '8x8' | '10x10' | '12x12'
  blurb: string
  ideasTitle: string
  ideas: { title: string; text: string }[]
  flowTitle: string
  flow: string[]
  tips: { title: string; text: string }[]
  whyTitle: string
  why: string[]
  faq: { q: string; a: string }[]
  /** related blog articles (slugs in lib/content/articles.json) */
  articles: string[]
}

export const THEMES: Theme[] = [
  {
    slug: 'wedding-photo-book',
    nav: 'Wedding & Love',
    metaTitle: 'Wedding Photo Book: Custom Wedding Albums | Pixovo',
    metaDescription:
      'Make a custom wedding photo book from your photographer’s gallery and guest photos. AI lays out every page, you tweak it, we print it in the USA.',
    primaryKeyword: 'wedding photo book',
    keywords: ['wedding photo book', 'wedding album', 'custom wedding photo book', 'anniversary photo book', 'honeymoon photo book', 'wedding gift for couple'],
    eyebrow: 'Wedding & Love',
    h1: ['A wedding photo book', 'that feels like the day.'],
    lead:
      'Your wedding was over in a blink, and the photos are sitting in a download link. Turn them into a printed wedding photo book you can hold, flip through on your anniversary and hand to your parents.',
    image: '/images/template-classic.png',
    imageAlt: 'An elegant printed wedding photo book open on a table',
    templateId: 'ever-after',
    size: '12x12',
    blurb: 'Elegant layouts for the ceremony, the toasts and every first dance.',
    ideasTitle: 'What to put in a wedding photo book',
    ideas: [
      { title: 'Getting ready', text: 'Dresses, rings, the quiet nerves. Open the book with the morning so the day has a beginning.' },
      { title: 'The ceremony', text: 'Give the vows and the first kiss a full-page spread. These are the pages people linger on.' },
      { title: 'Portraits and the wedding party', text: 'Formal portraits, family groups and the silly shots with your friends that never make a highlights reel.' },
      { title: 'Guest photos', text: 'Ask guests to send their phone photos. They catch the candid moments your photographer was never standing near.' },
      { title: 'Reception and the dance floor', text: 'Toasts, cake, the first dance and the crowd. Lay these out as lively collages.' },
      { title: 'Keepsakes and notes', text: 'Add a photo of your invitation, your handwritten vows or the guest book messages as a closing page.' },
    ],
    flowTitle: 'Your wedding book in four steps',
    flow: [
      'Pick a size. Most couples choose 12×12 so the big moments can run across two pages.',
      'Upload your photographer’s gallery and any guest photos.',
      'Our smart auto-layout arranges them in about a minute, in the order you took them.',
      'Edit the pages, add your names and date, then order. Design is free; you only pay to print.',
    ],
    tips: [
      { title: 'Tell it in order', text: 'Morning to last dance reads like a story. Keep the timeline and let the layouts do the pacing.' },
      { title: 'Choose fewer, bigger photos', text: 'A wedding book looks best when the favorites get room. Aim for one or two hero photos per spread.' },
      { title: 'Add the honeymoon', text: 'A few closing pages from the trip turn it into the story of your first week as a couple.' },
    ],
    whyTitle: 'Why couples print their wedding photos with Pixovo',
    why: [
      'Big two-page spreads so panoramic and group photos get the room they deserve.',
      'Printed and bound in the USA by a California factory that has been making photo books since 2003.',
      'Design free, pay only to print, and love it or we’ll make it right.',
    ],
    faq: [
      { q: 'How many photos should a wedding photo book have?', a: '<p>There is no fixed number. Choose your favorites rather than the whole gallery, give the big moments their own spreads, and add extra pages if you have a large gallery.</p>' },
      { q: 'Can I add photos from my guests?', a: '<p>Yes. Upload everything in one go, including phone photos sent by family and friends, and the layout tool will place them alongside your photographer’s shots.</p>' },
      { q: 'What size is best for a wedding photo book?', a: '<p>12×12 is a popular choice for weddings because large photos and panoramas get more space. 10×10 is a good balance of size and price, and 8×8 works well as a smaller copy for parents.</p>' },
      { q: 'Can I make a duplicate for parents or grandparents?', a: '<p>Yes. Once your book is finished you can order more than one copy from the cart, so everyone gets their own.</p>' },
      { q: 'Is a wedding photo book a good anniversary or couple gift?', a: '<p>It is one of the most personal gifts you can give. You can build the book from a couple’s photos, add a dedication on the first page and send it straight to their address.</p>' },
    ],
    articles: ['wedding-photo-book-ideas', 'photo-book-sizes-guide'],
  },
  {
    slug: 'baby-first-year-photo-book',
    nav: 'Baby & Family',
    metaTitle: 'Baby First Year Photo Book: Custom Baby Albums | Pixovo',
    metaDescription:
      'Turn your baby’s first year into a keepsake photo book. Month-by-month milestones, family photos and grandparent gifts, auto-laid out and printed in the USA.',
    primaryKeyword: 'baby first year photo book',
    keywords: ['baby first year photo book', 'baby photo book', 'baby milestone photo book', 'newborn photo album', 'family photo book', 'gift for grandparents'],
    eyebrow: 'Baby & Family',
    h1: ['Your baby’s first year,', 'in a book they’ll love.'],
    lead:
      'They change every week. Your camera roll has thousands of photos from that first year, and you will never scroll back through them. Make a baby photo book that keeps the tiny hands, the first smile and the sleepy cuddles together.',
    image: '/images/photo-baby.png',
    imageAlt: 'A baby photo book showing newborn and first year milestone photos',
    size: '10x10',
    blurb: 'Month-by-month milestones, first smiles and family photos in one keepsake.',
    ideasTitle: 'Baby photo book page ideas',
    ideas: [
      { title: 'Newborn and the first days', text: 'Hospital photos, tiny hands and feet, the first outfit and the first night home.' },
      { title: 'Month by month', text: 'Give every month a spread so you can see how much your baby grows. Side-by-side photos make the change obvious.' },
      { title: 'Firsts and milestones', text: 'First smile, first bath, first solid food, first steps. These get big photos and a short caption.' },
      { title: 'You in the frame', text: 'Parents are often missing from baby photos. Add the ones where you are holding them.' },
      { title: 'Family and visitors', text: 'Grandparents, cousins and friends meeting the baby for the first time.' },
      { title: 'The first birthday', text: 'End with the cake smash. The book now has a beginning and a happy ending.' },
    ],
    flowTitle: 'Make a baby photo book in four steps',
    flow: [
      'Pick 8×8 for a small keepsake or 10×10 for room to breathe.',
      'Upload your photos from your phone, a computer or a shared album.',
      'Smart auto-layout builds the pages in about a minute, in date order.',
      'Add captions like “Month 3” or the date, then order it for yourself or as a gift.',
    ],
    tips: [
      { title: 'Add the date and age', text: 'A short caption such as “4 months” is the detail you will love in ten years.' },
      { title: 'Mix close-ups and wide shots', text: 'A few photos of the nursery and the home make the book feel like a time capsule.' },
      { title: 'Order a copy for grandparents', text: 'Grandparents are the people most likely to keep a printed book on the coffee table.' },
    ],
    whyTitle: 'Why parents choose Pixovo for baby photo books',
    why: [
      'Premium printed pages made to be handled, with a hardcover that survives toddler hands.',
      'No design skills needed. Auto-layout does the arranging and you edit what you want.',
      'Ships from the USA, with a love-it-or-we’ll-make-it-right promise.',
    ],
    faq: [
      { q: 'When should I make a baby first year photo book?', a: '<p>Many parents wait until the first birthday and make the whole year at once. Others collect photos in a folder each month, then upload everything together. Either works.</p>' },
      { q: 'How many pages do I need for a baby’s first year?', a: '<p>Start with 40 pages if you want roughly a spread per month, and add pages if you have more favorites. The price updates live as you choose.</p>' },
      { q: 'Can I add captions and dates?', a: '<p>Yes. The editor lets you add text boxes for titles, milestones, dates and notes to your baby.</p>' },
      { q: 'Is a baby photo book a good gift for grandparents?', a: '<p>It is one of the most-loved gifts for grandparents. Build the book, add a dedication page and send it directly to their address.</p>' },
      { q: 'Can I include family photos, not just the baby?', a: '<p>Yes, and we recommend it. Add the family, the grandparents and the moments where you are in the picture too.</p>' },
    ],
    articles: ['photo-book-gifts-every-occasion', 'make-photo-book-from-phone-photos'],
  },
  {
    slug: 'travel-photo-book',
    nav: 'Travel & Vacations',
    metaTitle: 'Travel Photo Book: Turn Trip Photos Into a Book | Pixovo',
    metaDescription:
      'Create a travel photo book from your vacation photos in minutes. Smart auto-layout, full-page landscapes and honeymoon, road trip or family trip layouts.',
    primaryKeyword: 'travel photo book',
    keywords: ['travel photo book', 'vacation photo book', 'honeymoon photo book', 'road trip photo book', 'trip photo album', 'travel photo book layout ideas'],
    eyebrow: 'Travel & Vacations',
    h1: ['A travel photo book', 'for every trip you took.'],
    lead:
      'You came home with 800 photos and a camera roll nobody will scroll. A travel photo book puts the best of the trip in order, with the sunsets full-page and the small moments in between.',
    image: '/images/template-collage.png',
    imageAlt: 'A travel photo book with landscape photos and a collage layout',
    templateId: 'road-trip',
    size: '10x10',
    blurb: 'Sunsets full-page, street scenes in collages, the whole trip in order.',
    ideasTitle: 'How to lay out a travel photo book',
    ideas: [
      { title: 'One chapter per place', text: 'Group photos by city, beach or stop. The book then reads like the route you took.' },
      { title: 'Full-page landscapes', text: 'Save your biggest views for full-page spreads. They are what people open the book to see.' },
      { title: 'Collages for the details', text: 'Food, signs, markets and street scenes work well as small-photo collages.' },
      { title: 'The downtime', text: 'Include the lazy breakfast and the airport. They are the parts you will smile at later.' },
      { title: 'People, not just places', text: 'Add portraits of everyone on the trip. Photos with faces are the ones you will look at most.' },
      { title: 'Maps and notes', text: 'Add a short caption with the place and date, or a line you want to remember.' },
    ],
    flowTitle: 'Make a travel photo book in four steps',
    flow: [
      'Choose the Road Trip template or start from a blank book.',
      'Upload your photos. Landscape and portrait photos are both handled.',
      'Auto-layout arranges the trip in about a minute.',
      'Add place names and dates, then order. Design is free; you pay to print.',
    ],
    tips: [
      { title: 'Cull to the best 100', text: 'A trip photo book works best with your favorites rather than every burst shot.' },
      { title: 'Keep the order', text: 'Chronological photos tell the story with no extra effort.' },
      { title: 'Print one per trip', text: 'A small stack of travel books looks great on a shelf and makes an easy gift for travel companions.' },
    ],
    whyTitle: 'Why travelers print with Pixovo',
    why: [
      'Wide pages that do justice to landscapes and panoramas.',
      'Fast to make from your phone. Most people finish in about 5 minutes.',
      'Printed in the USA and delivered in 5–10 working days.',
    ],
    faq: [
      { q: 'How do I make a travel photo book?', a: '<p>Upload your trip photos, choose a size, and the auto-layout arranges them into pages. You can then change layouts, add captions and place names, and order your book.</p>' },
      { q: 'What size is best for a travel photo book?', a: '<p>10×10 is the most popular for trips. Choose 12×12 if you have a lot of landscape photography and want the largest pages.</p>' },
      { q: 'Can I make a honeymoon photo book?', a: '<p>Yes. A honeymoon book works well as a follow-up to your wedding book. Use the same size so they sit together on the shelf.</p>' },
      { q: 'Can I add captions and place names?', a: '<p>Yes. Use the text tools to add titles, places, dates and short notes anywhere on a page.</p>' },
      { q: 'How many photos can I include?', a: '<p>Start from 20 pages and go up to 100 if you took a lot of pictures. Auto-layout adjusts the pages to fit your photos.</p>' },
    ],
    articles: ['travel-photo-book-ideas-how-to-turn-trip-photos-into-a-book', 'make-photo-book-from-phone-photos'],
  },
  {
    slug: 'year-in-review-photo-book',
    nav: 'Year in Review & Milestones',
    metaTitle: 'Year in Review Photo Book: Family Yearbook | Pixovo',
    metaDescription:
      'Make a year in review photo book: a family yearbook of your best moments, birthdays and milestones. Auto-laid out in minutes and printed in the USA.',
    primaryKeyword: 'year in review photo book',
    keywords: ['year in review photo book', 'family yearbook photo book', 'annual photo book', 'graduation photo book', 'milestone birthday photo book', 'retirement photo book'],
    eyebrow: 'Year in Review & Milestones',
    h1: ['Your year in review,', 'printed as a family yearbook.'],
    lead:
      'The everyday moments are the ones that disappear: the school plays, the birthdays, the Tuesday that turned into a great day. Make a year in review photo book once a year and keep a family yearbook that grows on your shelf.',
    image: '/images/hero-book.png',
    imageAlt: 'A family year in review photo book open on a coffee table',
    templateId: 'our-year',
    size: '10x10',
    blurb: 'Twelve months, birthdays, graduations and the everyday moments in between.',
    ideasTitle: 'Year in review photo book ideas',
    ideas: [
      { title: 'A spread for each month', text: 'Twelve spreads is a simple, satisfying structure. Pick the best four to six photos from each month.' },
      { title: 'Holidays and birthdays', text: 'The recurring events are where you see everyone change from year to year.' },
      { title: 'Graduations and big milestones', text: 'Give graduations, weddings, new homes and retirements their own opening pages.' },
      { title: 'Everyday life', text: 'School runs, pets, dinners and the backyard. These are what you will want to remember.' },
      { title: 'Trips and weekends away', text: 'A short travel chapter keeps the vacation photos inside the year’s story.' },
      { title: 'The year in numbers', text: 'Add a closing page with favorite songs, books or small facts about the year.' },
    ],
    flowTitle: 'Make a year in review book in four steps',
    flow: [
      'Save photos to one folder through the year, or collect them all in December.',
      'Upload them and choose the Our Year template or a blank book.',
      'Auto-layout puts them in date order in about a minute.',
      'Add a title like “2026” and captions, then order. Great as a holiday gift.',
    ],
    tips: [
      { title: 'Start a folder in January', text: 'Dropping favorite photos into a folder each month turns December into a five-minute job.' },
      { title: 'Use the same size every year', text: 'A consistent size makes a tidy row of yearbooks you will actually enjoy flipping through.' },
      { title: 'Make it a gift', text: 'A year in review book is a thoughtful gift for parents and grandparents who want to see how the year went.' },
    ],
    whyTitle: 'Why families make a yearly book with Pixovo',
    why: [
      'Simple enough to make in one evening, even with hundreds of photos.',
      'Good for graduations, milestone birthdays, retirement and every family event.',
      'Design free, pay only to print, and love it or we’ll make it right.',
    ],
    faq: [
      { q: 'What is a year in review photo book?', a: '<p>It is a printed summary of your year in photos: the trips, birthdays, holidays and everyday moments in one book, often made as a family yearbook.</p>' },
      { q: 'When should I make my year in review photo book?', a: '<p>Many families make it in December. If you want it as a holiday gift, order early so it arrives in time. You can also make a book for a school year or a milestone event.</p>' },
      { q: 'How many photos should I include?', a: '<p>If you want a spread for each month, a 40 or 60-page book works well. You can add or remove pages at any time before you order.</p>' },
      { q: 'Can I make a graduation or milestone birthday book?', a: '<p>Yes. Use the same tools for graduations, milestone birthdays, retirements and anniversaries. Add a title page and captions to make it personal.</p>' },
      { q: 'Can I make a book with just one theme, like a pet or a sports season?', a: '<p>Yes. Any set of photos can become a book. Upload them, choose a size and let auto-layout do the rest.</p>' },
    ],
    articles: ['fall-photo-book-ideas', 'photo-book-gifts-every-occasion'],
  },
]

export const getTheme = (slug: string) => THEMES.find((t) => t.slug === slug)
