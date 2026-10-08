'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { AlignCenter, AlignJustify, AlignLeft, AlignRight, Bold, ChevronDown, Italic, PaintBucket, Plus, Square } from 'lucide-react'
import { FONTS } from '@/lib/flow/catalog'
import { uid } from '@/lib/flow/layouts'
import type { Item, Spread } from '@/lib/flow/types'
import { cn } from '@/lib/utils'
import { createBurst, ops, pageBox } from './ops'

const SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 56, 64, 72, 96, 120, 160]
const COLORS = ['#2a2623', '#ffffff', '#c0553a', '#2f6bff', '#2f7a4f', '#d9a21b']

// Static, hand-written suggestions (not generated), so the panel never claims more than it does.
const POPULAR = ['Making memories together.', 'Where it all began.', 'Moments worth keeping.', 'Home is wherever we are.', 'Just us.', 'We will remember this day.']
const BY_TOPIC: Record<string, string[]> = {
  Travel: ['Wander often, wonder always.', 'Take only memories.', 'The best views come after the hardest climbs.', 'Adventure awaits.'],
  Family: ['Family is everything.', 'Little moments, big love.', 'Together is our favorite place.', 'Growing up, growing closer.'],
  Wedding: ['Today and always.', 'Our forever begins.', 'Love, laughter and happily ever after.', 'The best day of our lives.'],
  Baby: ['Hello, little one.', 'Tiny hands, big dreams.', 'You changed everything.', 'Every day a new first.'],
}

function Collapsible({ title, children, defaultOpen = true }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className="border-t border-foreground/8 py-4 first:border-t-0 first:pt-0">
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between text-left text-base font-semibold">
        {title}
        <ChevronDown className={cn('size-5 text-accent transition-transform', open && 'rotate-180')} />
      </button>
      {open && <div className="mt-4">{children}</div>}
    </section>
  )
}

const iconBtn = (on: boolean) =>
  cn('grid size-11 place-items-center rounded-xl transition', on ? 'bg-accent text-accent-foreground' : 'bg-secondary text-foreground/70 hover:bg-foreground/10')

export function TextEditor({ spread, item, onAdded, activeSide = 'left' }: { spread: Spread; item: Item | null; onAdded: (id: string) => void; activeSide?: 'left' | 'right' }) {
  const burst = useMemo(() => createBurst(), [])
  const [captionTab, setCaptionTab] = useState<'popular' | 'topic'>('popular')
  const [topic, setTopic] = useState('Travel')
  const text = item?.type === 'text' ? item : null

  const patch = (p: Partial<Item>) => text && ops.patch(spread.id, text.id, p)

  function addText(content = 'Your text here') {
    const dark = spread.bg === '#2a2623'
    const box = pageBox(spread, activeSide)
    const it: Item = {
      id: uid('t'), type: 'text', x: box.x0 + box.w * 0.1, y: 40, w: box.w * 0.8, h: 12, rotation: 0,
      text: content, font: 'sans', color: dark ? '#ffffff' : '#2a2623', size: 36, align: 'center',
    }
    ops.add(spread.id, it)
    onAdded(it.id)
  }

  function useCaption(c: string) {
    if (text) ops.patch(spread.id, text.id, { text: c })
    else addText(c)
  }

  const captions = captionTab === 'popular' ? POPULAR : BY_TOPIC[topic]

  return (
    <div>
      <button
        type="button"
        onClick={() => addText()}
        className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-secondary text-base font-semibold transition hover:bg-foreground/10"
      >
        <Plus className="size-5" /> Add Text
      </button>

      <div className="mt-6">
        <Collapsible title="Text Tools">
          {!text ? (
            <p className="rounded-xl bg-secondary px-3.5 py-4 text-sm text-muted-foreground">Select a text box on the page, or add one, to change its style.</p>
          ) : (
            <div className="space-y-5">
              <div>
                <label htmlFor="tt-text" className="mb-1.5 block text-sm text-muted-foreground">
                  Text
                </label>
                <textarea
                  id="tt-text"
                  value={text.text ?? ''}
                  rows={3}
                  onFocus={burst.begin}
                  onBlur={burst.end}
                  onChange={(e) => {
                    burst.begin()
                    ops.patchLive(spread.id, text.id, { text: e.target.value })
                  }}
                  className="w-full resize-none rounded-xl border border-foreground/12 bg-background p-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/25"
                />
              </div>

              <div>
                <label htmlFor="tt-font" className="mb-1.5 block text-sm text-muted-foreground">
                  Text styles
                </label>
                <div className="relative">
                  <select
                    id="tt-font"
                    value={text.font ?? 'sans'}
                    onChange={(e) => patch({ font: e.target.value })}
                    className="h-12 w-full appearance-none rounded-xl bg-secondary px-4 pr-10 text-sm outline-none focus:ring-2 focus:ring-accent/40"
                    style={{ fontFamily: FONTS.find((f) => f.id === (text.font ?? 'sans'))?.css }}
                  >
                    {FONTS.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-accent" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <label htmlFor="tt-size" className="sr-only">
                    Size
                  </label>
                  <select
                    id="tt-size"
                    value={SIZES.includes(text.size ?? 0) ? text.size : ''}
                    onChange={(e) => patch({ size: +e.target.value })}
                    className="h-12 w-full appearance-none rounded-xl bg-secondary px-4 pr-10 text-sm outline-none focus:ring-2 focus:ring-accent/40"
                  >
                    {!SIZES.includes(text.size ?? 0) && <option value="">{Math.round(text.size ?? 0)}</option>}
                    {SIZES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-accent" />
                </div>
                <label className="relative flex h-12 cursor-pointer items-center gap-3 rounded-xl bg-secondary px-4" aria-label="Text colour">
                  <span className="size-6 rounded-md ring-1 ring-black/15" style={{ background: text.color ?? '#2a2623' }} />
                  <ChevronDown className="ml-auto size-4 text-accent" />
                  <input
                    type="color"
                    value={text.color?.length === 7 ? text.color : '#2a2623'}
                    onChange={(e) => patch({ color: e.target.value })}
                    className="absolute inset-0 size-full cursor-pointer opacity-0"
                  />
                </label>
              </div>

              <div className="flex flex-wrap gap-2" role="group" aria-label="Quick colours">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={`Colour ${c}`}
                    onClick={() => patch({ color: c })}
                    className={cn('size-7 rounded-full ring-offset-2 ring-offset-card', text.color === c ? 'ring-2 ring-accent' : 'ring-1 ring-foreground/20')}
                    style={{ background: c }}
                  />
                ))}
              </div>

              <div className="flex gap-3">
                <button type="button" aria-label="Bold" aria-pressed={!!text.bold} onClick={() => patch({ bold: !text.bold })} className={iconBtn(!!text.bold)}>
                  <Bold className="size-5" />
                </button>
                <button type="button" aria-label="Italic" aria-pressed={!!text.italic} onClick={() => patch({ italic: !text.italic })} className={iconBtn(!!text.italic)}>
                  <Italic className="size-5" />
                </button>
              </div>

              <div>
                <p className="mb-2 text-sm text-muted-foreground">Text alignment</p>
                <div className="flex gap-3" role="group" aria-label="Text alignment">
                  {(
                    [
                      ['left', AlignLeft, 'Align left'],
                      ['right', AlignRight, 'Align right'],
                      ['center', AlignCenter, 'Align center'],
                      ['justify', AlignJustify, 'Justify'],
                    ] as const
                  ).map(([k, Icon, label]) => (
                    <button key={k} type="button" aria-label={label} aria-pressed={(text.align ?? 'center') === k} onClick={() => patch({ align: k })} className={iconBtn((text.align ?? 'center') === k)}>
                      <Icon className="size-5" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm text-muted-foreground">Text box effect</p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    aria-pressed={!!text.fill}
                    onClick={() => patch({ fill: text.fill ? null : '#ffffff' })}
                    className={cn('flex h-[4.5rem] w-20 flex-col items-center justify-center gap-1 rounded-xl text-sm transition', text.fill ? 'bg-accent text-accent-foreground' : 'bg-secondary text-foreground/70 hover:bg-foreground/10')}
                  >
                    <PaintBucket className="size-5" /> Fill
                  </button>
                  <button
                    type="button"
                    aria-pressed={!!text.border}
                    onClick={() => patch({ border: !text.border })}
                    className={cn('flex h-[4.5rem] w-20 flex-col items-center justify-center gap-1 rounded-xl text-sm transition', text.border ? 'bg-accent text-accent-foreground' : 'bg-secondary text-foreground/70 hover:bg-foreground/10')}
                  >
                    <Square className="size-5" /> Border
                  </button>
                  {text.fill && (
                    <label className="relative grid h-[4.5rem] w-20 cursor-pointer place-items-center rounded-xl bg-secondary text-sm" aria-label="Fill colour">
                      <span className="size-6 rounded-md ring-1 ring-black/15" style={{ background: text.fill }} />
                      <input type="color" value={text.fill.length === 7 ? text.fill : '#ffffff'} onChange={(e) => patch({ fill: e.target.value })} className="absolute inset-0 size-full cursor-pointer opacity-0" />
                    </label>
                  )}
                </div>
              </div>
            </div>
          )}
        </Collapsible>

        <Collapsible title="Caption Ideas" defaultOpen={false}>
          <div role="tablist" className="mb-4 grid grid-cols-2 border-b border-foreground/10">
            {(['popular', 'topic'] as const).map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={captionTab === t}
                onClick={() => setCaptionTab(t)}
                className={cn('relative pb-2.5 text-sm font-semibold transition', captionTab === t ? 'text-accent' : 'text-muted-foreground hover:text-foreground')}
              >
                {t === 'popular' ? 'Popular' : 'By Topic'}
                {captionTab === t && <span className="absolute inset-x-6 bottom-0 h-0.5 rounded-full bg-accent" />}
              </button>
            ))}
          </div>
          {captionTab === 'topic' && (
            <div className="mb-3 flex flex-wrap gap-2">
              {Object.keys(BY_TOPIC).map((t) => (
                <button key={t} type="button" aria-pressed={topic === t} onClick={() => setTopic(t)} className={cn('rounded-full px-3 py-1.5 text-xs font-medium transition', topic === t ? 'bg-foreground text-background' : 'bg-secondary hover:bg-foreground/10')}>
                  {t}
                </button>
              ))}
            </div>
          )}
          <p className="mb-3 text-xs text-muted-foreground">{text ? 'Tap one to replace the selected text.' : 'Tap one to add it to your page.'}</p>
          <ul className="flex flex-wrap gap-2">
            {captions.map((c) => (
              <li key={c}>
                <button type="button" onClick={() => useCaption(c)} className="rounded-lg bg-accent/12 px-3 py-2 text-left text-sm font-medium transition hover:bg-accent/20">
                  {c}
                </button>
              </li>
            ))}
          </ul>
        </Collapsible>
      </div>
    </div>
  )
}
