import { Fredoka, Instrument_Serif, Playfair_Display } from 'next/font/google'

// Optional text styles for the printed book. Loaded for the editor only, so the rest of the site ships a single font (Poppins).
const classic = Instrument_Serif({ subsets: ['latin'], weight: '400', variable: '--font-instrument', display: 'swap' })
const elegant = Playfair_Display({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-playfair', display: 'swap' })
const playful = Fredoka({ subsets: ['latin'], variable: '--font-fredoka', display: 'swap' })

export default function EditorLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${classic.variable} ${elegant.variable} ${playful.variable}`}>{children}</div>
}
