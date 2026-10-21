'use client'

import { Sparkles } from 'lucide-react'
import { CoverWidget, SizeWidget } from '@/components/story/widgets'
import { PrimaryButton } from '@/components/story/stage-parts'
import { PAGE_COUNTS, TEMPLATES, type TemplateId } from '@/lib/flow/catalog'
import { flow } from '@/lib/flow/store'
import { QUESTIONS } from '@/lib/flow/story-questions'
import type { BookConfig } from '@/lib/flow/types'
import { cn } from '@/lib/utils'
import { TemplatePicker } from './template-picker'

function Label({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3">
      <h3 className="text-sm font-semibold text-[#16324f]">{children}</h3>
      {hint && <span className="text-xs text-[#16324f]/55">{hint}</span>}
    </div>
  )
}

/**
 * Every choice about the book, asked in one go inside the chat: size, pages, cover and template, plus the two or three
 * questions that belong to the chosen template. Nothing is required; the defaults are fine and any question can be left
 * blank. One Continue button finishes the lot.
 */
export function SetupCard({
  config,
  picked,
  answers,
  onTemplate,
  onAnswer,
  onContinue,
}: {
  config: BookConfig
  picked: boolean
  answers: Record<string, string>
  onTemplate: (id: TemplateId | undefined) => void
  onAnswer: (id: string, text: string) => void
  onContinue: () => void
}) {
  const tag = TEMPLATES.find((t) => t.id === config.templateId)?.tag ?? 'none'
  const questions = picked ? (QUESTIONS[tag] ?? QUESTIONS.none) : []

  return (
    <div className="space-y-7 rounded-3xl bg-white/80 p-4 ring-1 ring-white sm:p-6">
      <section>
        <Label>Size</Label>
        <SizeWidget value={config.size} onPick={(id) => flow.setConfig({ size: id })} />
      </section>

      <section>
        <Label hint="Needs at least one photo per page">Pages</Label>
        <div className="flex flex-wrap gap-2">
          {PAGE_COUNTS.map((n) => (
            <button key={n} type="button" aria-pressed={config.pages === n} onClick={() => flow.setConfig({ pages: n })} className={cn('inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium tabular-nums transition active:scale-[0.97]', config.pages === n ? 'bg-[#16324f] text-white' : 'bg-white text-[#16324f] ring-1 ring-[#f0d9cb] hover:ring-[#d4673f]/45')}>
              {n} pages
            </button>
          ))}
        </div>
      </section>

      <section>
        <Label>Cover</Label>
        <CoverWidget value={config.cover} onPick={(id) => flow.setConfig({ cover: id })} />
      </section>

      <section>
        <Label hint="Optional">Template</Label>
        <TemplatePicker value={config.templateId as TemplateId | undefined} picked={picked} onPick={onTemplate} />
      </section>

      {questions.length > 0 && (
        <section aria-label="About your book" className="st-rise rounded-2xl bg-[#fbf3ea] p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="size-4 text-[#d4673f]" aria-hidden />
            <p className="text-sm font-semibold text-[#16324f]">
              A little about it <span className="font-normal text-[#16324f]/60">· optional, helps Pixie write your captions</span>
            </p>
          </div>
          <div className="space-y-5">
            {questions.map((q) => {
              const v = answers[q.id] ?? ''
              return (
                <div key={`${tag}-${q.id}`}>
                  <label htmlFor={`q-${q.id}`} className="mb-2 block text-sm font-medium text-[#16324f]">
                    {q.ask}
                  </label>
                  {q.chips && (
                    <div className="mb-2 flex flex-wrap gap-2">
                      {q.chips.map((c) => (
                        <button key={c} type="button" aria-pressed={v === c} onClick={() => onAnswer(q.id, v === c ? '' : c)} className={cn('inline-flex min-h-10 items-center rounded-full px-4 text-sm font-medium transition active:scale-[0.97]', v === c ? 'bg-[#16324f] text-white' : 'bg-white text-[#16324f] ring-1 ring-[#e8dfd2] hover:ring-[#d4673f]/50')}>
                          {c}
                        </button>
                      ))}
                    </div>
                  )}
                  <input id={`q-${q.id}`} value={v} onChange={(e) => onAnswer(q.id, e.target.value.slice(0, 80))} placeholder={q.placeholder ?? (q.chips ? 'Or type your own…' : 'Type your answer…')} className="h-12 w-full rounded-full border border-[#e8dfd2] bg-white px-5 text-[15px] text-[#16324f] outline-none transition placeholder:text-[#16324f]/40 focus:border-[#d4673f] focus:ring-4 focus:ring-[#d4673f]/15" />
                </div>
              )
            })}
          </div>
        </section>
      )}

      <div className="flex flex-col gap-3 border-t border-[#eee7db] pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-[#16324f]/60">Not sure about something? Leave it, you can change it from the preview.</p>
        <PrimaryButton onClick={onContinue} className="w-full sm:w-auto">
          Continue to photos
        </PrimaryButton>
      </div>
    </div>
  )
}
