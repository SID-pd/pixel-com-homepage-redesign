'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { ArrowLeft, ArrowRight, Check, LayoutTemplate } from 'lucide-react'
import { TEMPLATES, type TemplateId } from '@/lib/flow/catalog'
import { cn } from '@/lib/utils'

/**
 * Template choice, in the same look as the homepage's "Start from a template" strip: tall cards with the tag on top and the
 * name on a white pill. Here the card is selectable instead of a link. Choosing is optional.
 */
export function TemplatePicker({ value, picked, onPick }: { value?: TemplateId; picked: boolean; onPick: (id: TemplateId | undefined) => void }) {
  const scroller = useRef<HTMLUListElement>(null)
  const scrollBy = (dir: 1 | -1) => scroller.current?.scrollBy({ left: dir * scroller.current.clientWidth * 0.8, behavior: 'smooth' })

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-[13px] text-[#16324f]/70">Pick a starting design, or skip and let Pixie choose.</p>
        <div className="hidden gap-2 sm:flex">
          <button type="button" onClick={() => scrollBy(-1)} aria-label="Previous templates" className="grid size-10 place-items-center rounded-full text-[#16324f] ring-1 ring-inset ring-[#16324f]/15 transition hover:bg-[#16324f] hover:text-white active:scale-95">
            <ArrowLeft className="size-4" />
          </button>
          <button type="button" onClick={() => scrollBy(1)} aria-label="Next templates" className="grid size-10 place-items-center rounded-full text-[#16324f] ring-1 ring-inset ring-[#16324f]/15 transition hover:bg-[#16324f] hover:text-white active:scale-95">
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>

      <ul ref={scroller} role="radiogroup" aria-label="Template" className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-1 pb-3 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <li className="w-[42vw] shrink-0 snap-start sm:w-[170px]">
          <button type="button" role="radio" aria-checked={picked && !value} onClick={() => onPick(undefined)} className={cn('relative grid aspect-[4/5] w-full place-items-center rounded-[1.5rem] border-2 border-dashed bg-white/70 p-3 text-center transition active:scale-[0.98]', picked && !value ? 'border-[#d4673f] bg-[#fbeee6]' : 'border-[#d9cdbb] hover:border-[#c8b79e]')}>
            <span className="grid gap-2 justify-items-center">
              <span className="grid size-11 place-items-center rounded-full bg-[#fbeee6] text-[#d4673f]">
                <LayoutTemplate className="size-5" />
              </span>
              <span className="text-sm font-semibold text-[#16324f]">No template</span>
              <span className="text-[11px] leading-snug text-[#16324f]/60">Pixie arranges it for you</span>
            </span>
            {picked && !value && <Tick />}
          </button>
        </li>

        {TEMPLATES.map((t) => {
          const on = value === t.id
          return (
            <li key={t.id} className="w-[42vw] shrink-0 snap-start sm:w-[170px]">
              <button type="button" role="radio" aria-checked={on} onClick={() => onPick(t.id as TemplateId)} className="group block w-full text-left focus-visible:outline-none">
                <span className={cn('relative block aspect-[4/5] overflow-hidden rounded-[1.5rem] bg-[#efe7da] shadow-md ring-2 transition duration-300 group-active:scale-[0.98]', on ? 'ring-[#d4673f] shadow-xl' : 'ring-transparent group-hover:shadow-xl group-focus-visible:ring-[#d4673f]/50')}>
                  <Image src={t.image} alt={`${t.name} template preview`} fill sizes="170px" className="object-cover transition-transform duration-700 group-hover:scale-[1.06]" />
                  <span className="absolute left-2.5 top-2.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold text-[#191514] shadow-sm" style={{ backgroundColor: t.tagBg }}>
                    {t.tag}
                  </span>
                  <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <span className="absolute inset-x-2 bottom-2 rounded-2xl bg-white/92 px-3 py-2 shadow-lg">
                    <span className="block text-sm font-bold leading-tight text-[#191514]">{t.name}</span>
                    <span className="block text-[11px] font-medium text-[#16324f]/60">{t.pages} pages layout</span>
                  </span>
                  {on && <Tick />}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function Tick() {
  return (
    <span className="absolute right-2.5 top-2.5 z-10 grid size-6 place-items-center rounded-full bg-[#d4673f] text-white shadow-md">
      <Check className="size-3.5" strokeWidth={3} />
    </span>
  )
}
