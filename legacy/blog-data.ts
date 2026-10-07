export interface BlogPost {
  id: string
  slug: string
  title: string
  subtitle?: string
  category: 'Guides' | 'Tips & Tricks' | 'Inspiration' | 'Product Updates'
  date: string
  readTime: string
  author: string
  image: string
  innerImage?: string
  summary: string
  content?: {
    sections: {
      title: string
      body: string
      bullets?: string[]
      callout?: {
        type: 'info' | 'warning' | 'tip'
        title: string
        text: string
      }
    }[]
    comparisonTable?: {
      headers: string[]
      rows: string[][]
    }
    faqs?: {
      question: string
      answer: string
    }[]
  }
}

export const blogPosts: BlogPost[] = [
  {
    id: 'photo-book-sizes-guide',
    slug: 'photo-book-sizes-guide',
    title: 'Photo Book Sizes Guide: 8x8 vs 10x10 vs 12x12 Explained',
    subtitle: 'Which size is actually right for your family photos, travel memories, or wedding album in 2026?',
    category: 'Inspiration',
    date: 'Sep 22, 2026',
    readTime: '6 min read',
    author: 'Pixovo Editorial Team',
    image: '/images/photo_book_size_explained_outer.png',
    summary: 'Comprehensive size comparison guide helping you choose between 8x8, 10x10, and 12x12 square photo books based on photo resolution, page count, and occasion.',
    content: {
      sections: [
        {
          title: 'All 3 Sizes At A Glance',
          body: 'Choosing the right photo book size is the single most important decision before uploading your photos. The right dimensions ensure your photos look crisp, your text stays readable, and your album fits comfortably on coffee tables or bookshelves.',
          bullets: [
            '8x8 Inches: Compact, affordable, and ideal for everyday moments, trip recaps, or baby monthlies.',
            '10x10 Inches: Our most popular size. The sweet spot for annual family albums, vacation highlights, and anniversary gifts.',
            '12x12 Inches: Large format deluxe album. Perfect for high-resolution wedding photography and milestone celebrations.',
          ],
        },
        {
          title: 'Detailed Size & Spec Comparison',
          body: 'Here is how our three square book sizes stack up side by side in terms of page capacity, image density, and starting price:',
        },
        {
          title: 'Common Mistakes To Avoid When Picking a Size',
          body: 'Many memory makers pick a size without considering image resolution or how the book will be displayed. Here are key mistakes to avoid:',
          callout: {
            type: 'warning',
            title: 'Low-Resolution Mobile Photos on 12x12 Books',
            text: 'If your photos were saved from WhatsApp or social media compressed feeds, expanding them to full 12x12 page spreads may cause pixelation. For low-res phone captures, choose 8x8 or keep multiple photo grids per spread.',
          },
        },
      ],
      comparisonTable: {
        headers: ['Size', 'Best For', 'Ideal Page Count', 'Base Price (50% OFF)'],
        rows: [
          ['8x8 Inches', 'Everyday, Baby, Mini Trips', '20–40 Pages', '$19.99 ($39.99)'],
          ['10x10 Inches', 'Family Albums, Vacations, Gifts', '30–80 Pages', '$29.99 ($59.99)'],
          ['12x12 Inches', 'Weddings, Milestones, Portfolios', '40–120 Pages', '$39.99 ($79.99)'],
        ],
      },
      faqs: [
        {
          question: 'Can I change my photo book size after uploading photos?',
          answer: 'Yes! Pixovo AI automatically adjusts layout grids and safe margins when you switch between 8x8, 10x10, and 12x12 sizes.',
        },
        {
          question: 'Which size works best for gift giving?',
          answer: 'The 10x10 size is universally loved for gifts as it feels substantial in hand without requiring extra large shelf space.',
        },
      ],
    },
  },
  {
    id: 'fall-photo-book-ideas',
    slug: 'fall-photo-book-ideas',
    title: 'Fall Photo Books: Capture Your Autumn Family Moments Into a Keepsake Album',
    subtitle: 'From pumpkin patches to Thanksgiving dinners, preserve your golden autumn memories.',
    category: 'Inspiration',
    date: 'Sep 17, 2026',
    readTime: '5 min read',
    author: 'Sarah Jenkins',
    image: '/images/fall_photo_books_outer.png',
    summary: 'Capture rich autumn colors, cozy family gatherings, and Halloween memories into a lasting photo book.',
  },
  {
    id: 'photo-book-gifts-every-occasion',
    slug: 'photo-book-gifts-every-occasion',
    title: 'Best Photo Book Gifts for Every Occasion in 2026: Ideas & Tips',
    subtitle: 'Thoughtful gift ideas for birthdays, holidays, anniversaries, and grand-parent keepsakes.',
    category: 'Inspiration',
    date: 'Sep 09, 2026',
    readTime: '7 min read',
    author: 'Mark Davis',
    image: '/images/photo_book_gifts_every_occasion_outer.png',
    summary: 'From birthdays and anniversaries to weddings and holidays, discover how to craft meaningful photo book gifts.',
  },
  {
    id: 'wedding-photo-book-ideas',
    slug: 'wedding-photo-book-ideas',
    title: 'The Best Wedding Photo Book Ideas for 2026 (and Mistakes to Avoid)',
    subtitle: 'Chronicle your special day from morning preparations to the grand exit.',
    category: 'Inspiration',
    date: 'Aug 31, 2026',
    readTime: '8 min read',
    author: 'Emily Watson',
    image: '/images/baby_and_family_photo_book_ideas_outer.png',
    summary: 'Organize wedding day photos, layout ceremony spreads, and avoid common design pitfalls.',
  },
  {
    id: 'travel-photo-book-ideas-how-to-turn-trip-photos-into-a-book',
    slug: 'travel-photo-book-ideas-how-to-turn-trip-photos-into-a-book',
    title: "Travel Photo Book Ideas: How to Turn Trip Photos Into a Book You'll Actually Look At",
    subtitle: 'Turn 1,000+ camera roll snapshots into a beautifully organized travel coffee table album.',
    category: 'Inspiration',
    date: 'Aug 21, 2026',
    readTime: '6 min read',
    author: 'David Chen',
    image: '/images/travel_photobook_idea_outer.png',
    innerImage: '/images/travel_photobook_idea_inner.png',
    summary: 'Transform thousands of vacation snapshots into a curated, magazine-quality travel album in minutes.',
  },
  {
    id: 'ai-photo-book-vs-traditional-photo-book',
    slug: 'ai-photo-book-vs-traditional-photo-book',
    title: "AI Photo Book vs Traditional Photo Book: What's Actually Different?",
    subtitle: 'Manual drag-and-drop software versus modern smart computer vision arrangement.',
    category: 'Inspiration',
    date: 'Aug 10, 2026',
    readTime: '5 min read',
    author: 'Tech & Design Team',
    image: '/images/ai_photo_book_vs_traditional_photobook_outer.png',
    innerImage: '/images/ai_photo_book_vs_traditional_photobook_inner.png',
    summary: 'A side-by-side comparison of automated AI layout engines versus manual drag-and-drop editors.',
  },
  {
    id: 'best-online-photo-book-services',
    slug: 'best-online-photo-book-services',
    title: 'Best Online Photo Book Services in 2026: Top 5 Compared',
    subtitle: 'Comparing print quality, speed, pricing, and ease of use across top photobook printers.',
    category: 'Inspiration',
    date: 'July 31, 2026',
    readTime: '9 min read',
    author: 'Pixovo Review Lab',
    image: '/images/best_online_photo_book_outer.png',
    innerImage: '/images/best_online_photo_book_inner.png',
    summary: 'Comparing print quality, turnarounds, pricing, and AI design features across leading photo book platforms.',
  },
  {
    id: 'make-photo-book-from-phone-photos',
    slug: 'make-photo-book-from-phone-photos',
    title: 'How to Make a Photo Book From Your Phone Photos in Under 5 Minutes',
    subtitle: 'No laptop needed: select photos from your iOS or Android camera roll and print instantly.',
    category: 'Guides',
    date: 'July 30, 2026',
    readTime: '4 min read',
    author: 'Alex Turner',
    image: '/images/how_to_make_photo_book_outer.png',
    summary: 'Step-by-step guide to selecting phone photos, auto-arranging spreads, and ordering directly from your device.',
  },
  {
    id: 'what-is-an-ai-photo-book-maker-how-it-works-and-whether-its-worth-it',
    slug: 'what-is-an-ai-photo-book-maker-how-it-works-and-whether-its-worth-it',
    title: "What Is an AI Photo Book Maker? How It Works and Whether It's Worth It",
    subtitle: 'How smart page layout algorithms turn raw photo bursts into balanced photo book spreads.',
    category: 'Guides',
    date: 'July 24, 2026',
    readTime: '6 min read',
    author: 'Pixovo AI Team',
    image: '/images/what_is_ai_photo_book_outer.png',
    innerImage: '/images/what_is_ai_photo_book_maker_inner.png',
    summary: 'Learn how computer vision and layout algorithms auto-select and arrange your best memories automatically.',
  },
]
