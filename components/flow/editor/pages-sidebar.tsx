'use client'

import { useEffect, useRef, useState } from 'react'
import { Copy, GripVertical, LayoutGrid, MoreHorizontal, RectangleVertical, Trash2, ArrowUp, ArrowDown } from 'lucide-react'
import type { Photo, Spread } from '@/lib/flow/types'
import { cn } from '@/lib/utils'
import { SpreadView } from '../spread-view'
import { ops } from './ops'

const HINT_KEY = 'pixovo-pages-hint-dismissed'

/**
 * Desktop pages strip (right side): every spread as a thumbnail with its page numbers.
 * Click to open, drag to rearrange, ••• for duplicate / move / delete.
 */
export function PagesSidebar({
  spreads,
  photos,
  index,
  onOpen,
  onMutated,
}: {
  spreads: Spread[]
  photos: Photo[]
  index: number
  onOpen: (i: number) => void
  onMutated: (i: number) => void
}) {
  const [grid, setGrid] = useState(false)
  const [hint, setHint] = useState(false)
  const [menu, setMenu] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)
  const dragFrom = useRef<number | null>(null)
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      setHint(localStorage.getItem(HINT_KEY) !== '1')
    } catch {
      setHint(true)
    }
  }, [])

  useEffect(() => {
    if (menu === null) return
    const close = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('[data-page-menu]')) setMenu(null)
    }
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setMenu(null)
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', esc)
    }
  }, [menu])

  // Keep the open spread in view when navigating with the arrows.
  useEffect(() => {
    root.current?.querySelector<HTMLElement>(`[data-spread="${index}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [index])

  const canAdd = ops.canAddSpread(spreads.length)
  const canRemove = ops.canRemoveSpread(spreads.length)

  return (
    <div ref={root} className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-1.5 px-3 pb-2 pt-3">
        <div role="group" aria-label="Pages layout" className="inline-flex rounded-lg bg-secondary p-0.5">
          {([[false, RectangleVertical, 'List'], [true, LayoutGrid, 'Grid']] as const).map(([g, Icon, label]) => (
            <button
              key={label}
              type="button"
              aria-label={`${label} view`}
              aria-pressed={grid === g}
              onClick={() => setGrid(g)}
              className={cn('grid size-8 place-items-center rounded-md transition', grid === g ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground')}
            >
              <Icon className="size-4" />
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        {hint && (
          <div className="relative mb-3 rounded-xl bg-accent/10 p-3 text-xs leading-relaxed text-foreground/80">
            <p>
              Drag and drop spreads to rearrange them. Click <MoreHorizontal className="inline size-3.5 align-text-bottom" /> to copy and delete.
            </p>
            <button
              type="button"
              onClick={() => {
                setHint(false)
                try {
                  localStorage.setItem(HINT_KEY, '1')
                } catch {
                  /* ignore */
                }
              }}
              className="mt-1.5 font-semibold text-accent underline-offset-4 hover:underline"
            >
              Got it
            </button>
          </div>
        )}

        <ul className={cn('gap-3', grid ? 'grid grid-cols-2' : 'flex flex-col')} aria-label="Pages">
          {spreads.map((s, i) => {
            const cover = s.kind === 'cover'
            const active = i === index
            return (
              <li
                key={s.id}
                data-spread={i}
                className={cn('group relative', cover && grid && 'col-span-2')}
                draggable={!cover}
                onDragStart={(e) => {
                  dragFrom.current = i
                  e.dataTransfer.effectAllowed = 'move'
                  e.dataTransfer.setData('text/plain', `spread:${i}`)
                }}
                onDragOver={(e) => {
                  if (cover || dragFrom.current === null) return
                  e.preventDefault()
                  setDragOver(i)
                }}
                onDragLeave={() => setDragOver((d) => (d === i ? null : d))}
                onDrop={(e) => {
                  e.preventDefault()
                  const from = dragFrom.current
                  dragFrom.current = null
                  setDragOver(null)
                  if (from === null || cover) return
                  ops.reorderSpread(from, i)
                  onMutated(i)
                }}
                onDragEnd={() => {
                  dragFrom.current = null
                  setDragOver(null)
                }}
              >
                {dragOver === i && dragFrom.current !== i && <span aria-hidden className="absolute -top-2 inset-x-0 h-1 rounded-full bg-accent" />}
                <button
                  type="button"
                  onClick={() => onOpen(i)}
                  aria-label={cover ? 'Open cover' : `Open pages ${i * 2 - 1} and ${i * 2}`}
                  aria-current={active}
                  className={cn(
                    'block w-full rounded-md p-0.5 text-left transition',
                    active ? 'ring-[3px] ring-accent' : 'ring-1 ring-black/10 hover:ring-accent/60',
                    cover && 'mx-auto',
                    cover && !grid && 'w-3/4',
                    cover && grid && 'w-1/2',
                  )}
                >
                  <div className="overflow-hidden rounded-[3px] bg-secondary shadow-xs">
                    <SpreadView spread={s} photos={photos} />
                  </div>
                </button>
                <p className="mt-1.5 flex items-center justify-between px-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {cover ? (
                    <span className="mx-auto">Front cover</span>
                  ) : (
                    <>
                      <span>{i * 2 - 1}</span>
                      <span>{i * 2}</span>
                    </>
                  )}
                </p>

                {!cover && (
                  <>
                    <span className="pointer-events-none absolute left-1 top-1 hidden rounded bg-background/85 p-0.5 text-muted-foreground group-hover:block" aria-hidden>
                      <GripVertical className="size-3.5" />
                    </span>
                    <div data-page-menu className="absolute right-1 top-1">
                      <button
                        type="button"
                        aria-label={`Options for pages ${i * 2 - 1} and ${i * 2}`}
                        aria-haspopup="menu"
                        aria-expanded={menu === i}
                        onClick={() => setMenu(menu === i ? null : i)}
                        className={cn('grid size-7 place-items-center rounded-md bg-background/90 shadow-xs transition hover:bg-background', menu === i ? 'opacity-100' : 'opacity-0 focus-visible:opacity-100 group-hover:opacity-100')}
                      >
                        <MoreHorizontal className="size-4" />
                      </button>
                      {menu === i && (
                        <div role="menu" className="absolute right-0 top-full z-20 mt-1 w-44 rounded-xl bg-card p-1 shadow-lift ring-1 ring-foreground/10">
                          <MenuItem icon={<Copy className="size-4" />} disabled={!canAdd} onClick={() => { ops.duplicateSpread(s.id); onMutated(i + 1); setMenu(null) }}>
                            Duplicate
                          </MenuItem>
                          <MenuItem icon={<ArrowUp className="size-4" />} disabled={i < 2} onClick={() => { ops.moveSpread(s.id, -1); onMutated(i - 1); setMenu(null) }}>
                            Move earlier
                          </MenuItem>
                          <MenuItem icon={<ArrowDown className="size-4" />} disabled={i >= spreads.length - 1} onClick={() => { ops.moveSpread(s.id, 1); onMutated(i + 1); setMenu(null) }}>
                            Move later
                          </MenuItem>
                          <MenuItem icon={<Trash2 className="size-4" />} danger disabled={!canRemove} onClick={() => { ops.removeSpread(s.id); onMutated(Math.max(1, Math.min(i, spreads.length - 2))); setMenu(null) }}>
                            Delete
                          </MenuItem>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

function MenuItem({ children, icon, onClick, disabled, danger }: { children: React.ReactNode; icon: React.ReactNode; onClick: () => void; disabled?: boolean; danger?: boolean }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      disabled={disabled}
      className={cn('flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition hover:bg-foreground/5 disabled:opacity-35', danger && 'text-destructive hover:bg-destructive/8')}
    >
      {icon} {children}
    </button>
  )
}
