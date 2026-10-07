'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AlertTriangle, ArrowLeft, Check, Pencil, ShoppingBag } from 'lucide-react'
import { SIZES, TEMPLATES, money, type SizeId, type TemplateId } from '@/lib/flow/catalog'
import { countPlaced, spreadCount } from '@/lib/flow/layouts'
import { unitPrice } from '@/lib/flow/pricing'
import { flow, useFlow } from '@/lib/flow/store'
import { cn } from '@/lib/utils'
import { BookPreview } from './book-preview'
import { BookSetup } from './book-setup'
import { FlowButton } from './flow-button'
import { FlowHeader, FlowShell } from './flow-shell'
import { PhotoUploader } from './photo-uploader'
import { Stepper } from './stepper'
import { SummaryCard } from './summary-card'

const CUSTOM_STEPS = ['Choose Size', 'Upload Photos', 'Review']
const TEMPLATE_STEPS = ['Upload Photos', 'Review']

export function Wizard() {
  const router = useRouter()
  const params = useSearchParams()
  const { hydrated, draft } = useFlow()
  const [adding, setAdding] = useState(false)

  // Apply deep-link params (?size=10x10, ?template=road-trip) once, then tidy the URL.
  useEffect(() => {
    if (!hydrated) return
    const size = params.get('size')
    const template = params.get('template')
    const validSize = SIZES.some((s) => s.id === size) ? (size as SizeId) : undefined
    const validTpl = TEMPLATES.some((t) => t.id === template) ? (template as TemplateId) : undefined
    flow.openDraft({ size: validSize, templateId: validTpl })
    if (size || template) window.history.replaceState(null, '', '/photo-book/')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated])

  const templateMode = !!draft?.config.templateId
  const labels = templateMode ? TEMPLATE_STEPS : CUSTOM_STEPS
  // draft.step is always 1 (setup), 2 (photos) or 3 (review); template mode skips setup.
  const step = draft ? (templateMode ? Math.max(2, draft.step) : draft.step) : 1
  const shown = templateMode ? step - 1 : step

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [step])

  const placed = useMemo(() => (draft ? countPlaced(draft.spreads) : { placed: 0, empty: 0 }), [draft])

  if (!draft) {
    return (
      <FlowShell header={<FlowHeader back={{ href: '/', label: 'Home' }} />}>
        <div className="h-96 animate-pulse rounded-3xl bg-secondary/60" />
      </FlowShell>
    )
  }

  const { config, photos } = draft
  const price = unitPrice(config)
  const total = spreadCount(config.pages) + 1

  function needsRebuild() {
    if (!draft) return false
    if (draft.spreads.length !== total) return true
    const used = new Set(draft.spreads.flatMap((s) => s.items.map((i) => i.photoId)))
    return draft.photos.some((p) => !used.has(p.id))
  }

  function next() {
    if (step === 2) {
      if (needsRebuild()) flow.buildBook()
      flow.setStep(3)
    } else flow.setStep(step + 1)
  }
  function back() {
    flow.setStep(step - 1)
  }

  async function addToCart(goTo: '/cart/' | '/checkout/') {
    setAdding(true)
    await flow.addToCart()
    router.push(goTo)
  }

  const canContinue = step === 2 ? photos.length > 0 : true
  const primaryLabel = step === 1 ? 'Continue' : step === 2 ? 'Build my book' : 'Add to cart'

  return (
    <FlowShell
      header={<FlowHeader back={{ href: '/', label: 'Home' }} />}
    >
      <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-8">
        <div className="order-2 lg:order-1 lg:sticky lg:top-24 lg:self-start">
          <SummaryCard config={config} onEdit={() => flow.setStep(1)} />
        </div>

        <div className="order-1 min-w-0 space-y-5 lg:order-2">
          <div className="mx-auto w-full max-w-xl px-1 pt-1 sm:px-4">
            <Stepper steps={labels} current={shown} onGo={(n) => flow.setStep(templateMode ? n + 1 : n)} />
          </div>

          {step === 1 && <BookSetup config={config} />}

          {step === 2 && (
            <>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Add your photos</h1>
                <p className="mt-1 text-muted-foreground">
                  {templateMode
                    ? `We’ll drop them into the “${config.title}” design automatically.`
                    : 'We’ll arrange them into a beautiful layout for you. You can fine-tune everything afterwards.'}
                </p>
              </div>
              {templateMode && (
                <details className="group rounded-2xl border border-foreground/8 bg-card px-4 py-3 text-sm">
                  <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
                    <span>
                      {SIZES.find((s) => s.id === config.size)!.label} · {config.pages} pages · {config.cover}
                    </span>
                    <span className="text-accent group-open:hidden">Change</span>
                    <span className="hidden text-accent group-open:inline">Done</span>
                  </summary>
                  <div className="mt-4">
                    <BookSetup config={config} showTemplates={false} />
                  </div>
                </details>
              )}
              <PhotoUploader photos={photos} recommended={config.pages} />
            </>
          )}

          {step === 3 && (
            <>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Looking good!</h1>
                <p className="mt-1 text-muted-foreground">
                  We laid out {placed.placed} photo{placed.placed === 1 ? '' : 's'} across {config.pages} pages. Flip through
                  your book, then add it to your cart.
                </p>
              </div>
              <BookPreview spreads={draft.spreads} photos={photos} />
              {placed.empty > 0 && (
                <div className="flex items-start gap-3 rounded-2xl bg-[oklch(0.96_0.05_85)] p-4 text-sm text-[oklch(0.4_0.08_70)]">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  <p>
                    <strong className="font-semibold">{placed.empty} photo spot{placed.empty === 1 ? '' : 's'} still empty.</strong>{' '}
                    Add more photos, or fill them in the editor. Empty spots simply print as blank space.
                  </p>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <FlowButton variant="secondary" onClick={() => router.push('/photo-book/editor/')}>
                  <Pencil className="size-4" /> Customize in editor
                </FlowButton>
                <button type="button" onClick={() => flow.setStep(2)} className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                  Add more photos
                </button>
              </div>
            </>
          )}

          {/* Desktop action row */}
          <div className="hidden items-center justify-between gap-3 pt-2 lg:flex">
            {step > (templateMode ? 2 : 1) ? (
              <FlowButton variant="ghost" onClick={back}>
                <ArrowLeft className="size-4" /> Back
              </FlowButton>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-3">
              {step === 3 && (
                <FlowButton variant="secondary" size="lg" loading={adding} onClick={() => addToCart('/checkout/')}>
                  Checkout now
                </FlowButton>
              )}
              <FlowButton
                variant="accent"
                size="lg"
                arrow={step !== 3}
                disabled={!canContinue}
                loading={adding && step === 3}
                onClick={step === 3 ? () => addToCart('/cart/') : next}
              >
                {step === 3 && <ShoppingBag className="size-4" />}
                {primaryLabel}
              </FlowButton>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile / tablet sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-foreground/8 bg-background/92 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          {step > (templateMode ? 2 : 1) && (
            <FlowButton variant="secondary" size="lg" onClick={back} aria-label="Back" className="!px-4">
              <ArrowLeft className="size-5" />
            </FlowButton>
          )}
          <div className="mr-auto leading-tight">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-lg font-semibold">{money(price)}</p>
          </div>
          <FlowButton
            variant="accent"
            size="lg"
            arrow={step !== 3}
            disabled={!canContinue}
            loading={adding}
            onClick={step === 3 ? () => addToCart('/cart/') : next}
          >
            {step === 3 && <Check className="size-4" />}
            {primaryLabel}
          </FlowButton>
        </div>
      </div>
    </FlowShell>
  )
}
