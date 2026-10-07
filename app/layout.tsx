import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Poppins } from 'next/font/google'
import { ClientProviders } from './providers'
import './globals.css'

// Same family and weights as the live pixovo.com (Poppins 400/500/600/700). One family keeps the site fast and consistent.
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
})

const introScript = `try{if(sessionStorage.getItem('pixovo-intro')||matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.dataset.introSeen='1'}catch(e){}`

export const metadata: Metadata = {
  title: 'Pixovo Custom Photo Book Maker for Square Photo Books',
  description:
    'Upload your photos and let Pixovo design a custom square photo book in minutes. Loved by 50,000+ customers. Printed in the USA. Start free.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-light-32x32.png', type: 'image/png' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#f8f5f0',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${poppins.variable} bg-background`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: introScript }} />
      </head>
      <body>
        <ClientProviders>
          {children}
        </ClientProviders>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
