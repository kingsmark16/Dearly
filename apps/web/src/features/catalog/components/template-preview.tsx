import type { ReactNode } from 'react'
import type { TemplateSummary } from '@dearly/contracts/catalog/template'

export function TemplatePreview({
  template,
  action,
}: {
  template: TemplateSummary
  action: ReactNode
}) {
  return (
    <div
      className="overflow-hidden rounded-[1.5rem] border border-[var(--dearly-blush)] bg-[linear-gradient(135deg,rgb(255_250_244/0.98),rgb(247_221_216/0.72))]"
      data-template-preview={template.slug}
    >
      <div className="relative min-h-56 overflow-hidden px-6 py-7 sm:px-8">
        <div
          aria-hidden="true"
          className="absolute -right-12 -top-16 h-40 w-40 rounded-full border border-white/80 bg-white/35"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-20 -left-10 h-44 w-44 rounded-full border border-white/70 bg-[var(--dearly-blush)]/35"
        />

        <div className="relative max-w-xl">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-[var(--dearly-plum)]">
            Opening preview
          </p>
          <p className="mt-5 text-sm uppercase tracking-[0.2em] text-[var(--dearly-muted)]">
            {template.preview.eyebrow}
          </p>
          <p className="mt-3 text-3xl leading-tight text-[var(--dearly-ink)] sm:text-4xl">
            {template.preview.title}
          </p>
          <p className="mt-4 max-w-lg text-base leading-7 text-[var(--dearly-muted)]">
            {template.preview.subtitle}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/80 px-6 py-4 sm:px-8">
        <span className="text-xs uppercase tracking-[0.16em] text-[var(--dearly-muted)]">
          {template.preview.ctaLabel}
        </span>
        {action}
      </div>
    </div>
  )
}
