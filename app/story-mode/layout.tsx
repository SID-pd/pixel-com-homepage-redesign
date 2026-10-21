import { Caveat } from 'next/font/google'
import type { CSSProperties } from 'react'

// Handwriting for captions and the scrapbook feel. Loaded for Story Mode only, so the rest of the site keeps one font (Poppins).
const hand = Caveat({ subsets: ['latin'], weight: ['500', '600'], variable: '--font-hand', display: 'swap' })

// "Little Moments" palette: cream, peach, lilac, mint, butter. Mint = ready, lilac = thinking, peach = reactions.
const palette = {
  '--st-cream': '#fdf6ec',
  '--st-peach': '#ffdcc6',
  '--st-peach-ink': '#b4532a',
  '--st-lilac': '#e7defe',
  '--st-lilac-ink': '#6a4fc4',
  '--st-mint': '#cff1e3',
  '--st-mint-ink': '#1f7a5c',
  '--st-butter': '#fff0b5',
  '--st-ink': '#3b2f2a',
} as CSSProperties

// Pixie's idle and pose animations. Plain CSS transforms, so they run on the compositor and cost almost nothing.
const css = `
@keyframes pixie-breathe{0%,100%{transform:translateY(0) scaleY(1)}50%{transform:translateY(-3px) scaleY(1.012)}}
@keyframes pixie-blink{0%,91%,100%{transform:scaleY(1)}94%{transform:scaleY(.08)}}
@keyframes pixie-talk{0%,100%{transform:scaleY(.5)}50%{transform:scaleY(1)}}
@keyframes pixie-scan{0%,100%{transform:translateX(-6px)}50%{transform:translateX(6px)}}
@keyframes pixie-dot{0%,100%{transform:translateY(0);opacity:.4}50%{transform:translateY(-3px);opacity:1}}
@keyframes pixie-spark{0%{opacity:0;transform:translate(0,0) scale(.4)}25%{opacity:1}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(1)}}
@keyframes st-rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.pixie-breathe{animation:pixie-breathe 4.4s ease-in-out infinite}
.pixie-blink{animation:pixie-blink 5.2s ease-in-out infinite}
.pixie-talk{animation:pixie-talk .46s ease-in-out infinite}
.pixie-scan{animation:pixie-scan 1.7s ease-in-out infinite}
.pixie-dot{animation:pixie-dot .9s ease-in-out infinite}
.pixie-spark{animation:pixie-spark 1.3s ease-out both}
.st-rise{animation:st-rise .28s ease-out both}
@media (prefers-reduced-motion:reduce){.pixie-breathe,.pixie-blink,.pixie-talk,.pixie-scan,.pixie-dot,.pixie-spark,.st-rise{animation:none!important}}
`

export default function StoryModeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={hand.variable} style={palette}>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      {children}
    </div>
  )
}
