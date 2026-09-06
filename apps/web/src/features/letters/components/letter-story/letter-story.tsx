'use client'

import type { CreatorLetterDraft } from '@dearly/contracts/letters/creator-letter'
import type { CreatorMediaAsset } from '@dearly/contracts/letters/media'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@dearly/ui/button'
import {
  createLetterStoryModel,
  type LetterStoryModelElement,
} from './letter-story-model'

type LetterStoryProps = {
  draft: CreatorLetterDraft
  mediaAssets: CreatorMediaAsset[]
}

const animationMarks = {
  hearts: '<3',
  sparkles: '*',
  petals: 'o',
  confetti: '+',
} as const

const animationColors = {
  hearts: 'text-rose-400',
  sparkles: 'text-amber-400',
  petals: 'text-pink-400',
  confetti: 'text-violet-400',
} as const

function OpeningScreen({
  opening,
  onOpen,
}: {
  opening: ReturnType<typeof createLetterStoryModel>['opening']
  onOpen: () => void
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <section
        aria-labelledby="letter-opening-title"
        className="w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/80 bg-white/75 shadow-[0_2rem_6rem_rgb(122_83_110/0.16)] backdrop-blur"
        data-preview-stage="opening"
      >
        <div className="relative isolate overflow-hidden px-7 py-20 text-center sm:px-16 sm:py-28">
          <div className="absolute -right-24 -top-24 -z-10 h-72 w-72 rounded-full bg-[var(--dearly-blush)] blur-3xl" />
          <div className="absolute -bottom-28 -left-20 -z-10 h-72 w-72 rounded-full bg-[#eadff0] blur-3xl" />
          <p className="text-sm uppercase tracking-[0.32em] text-[var(--dearly-plum)]">
            {opening.eyebrow}
          </p>
          <h1
            id="letter-opening-title"
            className="mx-auto mt-6 max-w-lg text-5xl leading-[1.05] tracking-tight sm:text-7xl"
          >
            {opening.title}
          </h1>
          <p className="mx-auto mt-7 max-w-md text-lg leading-8 text-[var(--dearly-muted)]">
            {opening.subtitle}
          </p>
          <Button className="mt-10" onClick={onOpen} type="button">
            {opening.ctaLabel}
          </Button>
        </div>
      </section>
    </main>
  )
}

function RequiredBlocker({
  element,
}: {
  element: Extract<LetterStoryModelElement, { type: 'required-blocker' }>
}) {
  return (
    <section
      aria-labelledby={`${element.id}-heading`}
      className="rounded-2xl border border-dashed border-[var(--dearly-plum)] bg-[var(--dearly-blush)]/35 p-5"
      data-element-id={element.id}
      data-required-field={element.fieldId}
    >
      <h2
        id={`${element.id}-heading`}
        className="text-3xl leading-tight sm:text-4xl"
      >
        {element.heading}
      </h2>
      <p
        className="mt-4 text-base leading-7 text-[var(--dearly-plum)]"
        role="alert"
      >
        {element.message}
      </p>
    </section>
  )
}

function StoryElement({
  element,
  isRevealed,
  onReveal,
}: {
  element: LetterStoryModelElement
  isRevealed: boolean
  onReveal: (elementId: string) => void
}) {
  switch (element.type) {
    case 'text':
      return (
        <section
          aria-labelledby={`${element.id}-heading`}
          className="space-y-5"
          data-element-id={element.id}
        >
          <h2
            id={`${element.id}-heading`}
            className="text-3xl leading-tight sm:text-4xl"
          >
            {element.heading}
          </h2>
          <p className="whitespace-pre-wrap text-lg leading-9 text-[var(--dearly-muted)] sm:text-xl">
            {element.body}
          </p>
        </section>
      )
    case 'reveal':
      return (
        <section
          aria-labelledby={`${element.id}-heading`}
          className="space-y-5"
          data-element-id={element.id}
        >
          <h2
            id={`${element.id}-heading`}
            className="text-3xl leading-tight sm:text-4xl"
          >
            {element.heading}
          </h2>
          {isRevealed ? (
            <p className="whitespace-pre-wrap text-lg leading-9 text-[var(--dearly-muted)] sm:text-xl">
              {element.body}
            </p>
          ) : (
            <Button onClick={() => onReveal(element.id)} type="button">
              {element.prompt}
            </Button>
          )}
        </section>
      )
    case 'audio':
      return (
        <section
          aria-labelledby={`${element.id}-heading`}
          className="space-y-5"
          data-element-id={element.id}
        >
          <h2
            id={`${element.id}-heading`}
            className="text-3xl leading-tight sm:text-4xl"
          >
            {element.label}
          </h2>
          <audio
            aria-label={element.label}
            className="w-full"
            controls
            preload="metadata"
            src={element.asset.previewUrl}
          />
        </section>
      )
    case 'photo-gallery':
      return (
        <section
          aria-labelledby={`${element.id}-heading`}
          className="space-y-5"
          data-element-id={element.id}
        >
          <h2
            id={`${element.id}-heading`}
            className="text-3xl leading-tight sm:text-4xl"
          >
            {element.heading}
          </h2>
          <ol
            aria-label={`${element.heading} photos`}
            className="grid gap-4 sm:grid-cols-2"
          >
            {element.assets.map((asset, index) => (
              <li key={asset.id} className="overflow-hidden rounded-2xl">
                <div
                  aria-label={`${index + 1}. ${asset.originalFileName}`}
                  className="aspect-[4/3] w-full rounded-2xl bg-cover bg-center bg-no-repeat"
                  role="img"
                  style={{ backgroundImage: `url(${asset.previewUrl})` }}
                />
              </li>
            ))}
          </ol>
        </section>
      )
    case 'animation':
      return (
        <div
          aria-hidden="true"
          className={`flex justify-center gap-6 py-2 text-3xl ${animationColors[element.token]}`}
          data-animation-token={element.token}
          data-animation-trigger={element.trigger}
          data-element-id={element.id}
        >
          {Array.from({ length: 5 }, (_, index) => (
            <span key={`${element.id}-${index}`}>
              {animationMarks[element.token]}
            </span>
          ))}
        </div>
      )
    case 'required-blocker':
      return <RequiredBlocker element={element} />
  }
}

function LetterStoryContent({
  draft,
  model,
  onReveal,
  revealedElementIds,
}: {
  draft: CreatorLetterDraft
  model: ReturnType<typeof createLetterStoryModel>
  onReveal: (elementId: string) => void
  revealedElementIds: ReadonlySet<string>
}) {
  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-10 sm:px-10 sm:py-16">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--dearly-plum)]">
          Creator preview - private
        </p>
        <Link
          className="text-sm font-semibold text-[var(--dearly-plum)] underline underline-offset-4"
          href={`/creator/letters/${draft.id}`}
        >
          Back to editor
        </Link>
      </div>

      <article
        className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/80 px-6 py-10 shadow-[0_2rem_6rem_rgb(122_83_110/0.12)] sm:px-14 sm:py-16"
        data-preview-stage="story"
      >
        <header className="border-b border-[var(--dearly-blush)] pb-10">
          <p className="text-sm uppercase tracking-[0.32em] text-[var(--dearly-plum)]">
            {model.categoryName}
          </p>
          <h1 className="mt-5 text-4xl leading-tight sm:text-6xl">
            {model.opening.title}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--dearly-muted)]">
            {model.opening.subtitle}
          </p>
        </header>

        {model.requiredFields.length > 0 ? (
          <aside
            aria-labelledby="preview-publish-blockers-heading"
            className="mt-8 rounded-2xl border border-dashed border-[var(--dearly-plum)] bg-[var(--dearly-blush)]/35 p-5"
            data-testid="preview-publish-blockers"
          >
            <h2 id="preview-publish-blockers-heading" className="text-xl">
              Publish blockers
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--dearly-muted)]">
              This private preview keeps incomplete required Fields visible.
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6 text-[var(--dearly-plum)]">
              {model.requiredFields.map((field) => (
                <li key={field.fieldId}>{field.message}</li>
              ))}
            </ul>
          </aside>
        ) : null}

        <div className="space-y-14 py-12">
          {model.elements.map((element) => (
            <StoryElement
              element={element}
              isRevealed={revealedElementIds.has(element.id)}
              key={element.id}
              onReveal={onReveal}
            />
          ))}
        </div>

        <footer className="border-t border-[var(--dearly-blush)] pt-8 text-center text-sm text-[var(--dearly-muted)]">
          Preview only - this Draft is not public.
        </footer>
      </article>
    </main>
  )
}

export function LetterStory({ draft, mediaAssets }: LetterStoryProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [revealedElementIds, setRevealedElementIds] = useState<Set<string>>(
    () => new Set(),
  )
  const model = useMemo(
    () =>
      createLetterStoryModel({
        template: draft.template,
        content: draft.content,
        mediaAssets,
      }),
    [draft.content, draft.template, mediaAssets],
  )

  function revealElement(elementId: string) {
    setRevealedElementIds((current) => {
      const next = new Set(current)
      next.add(elementId)
      return next
    })
  }

  if (!isOpen) {
    return (
      <OpeningScreen onOpen={() => setIsOpen(true)} opening={model.opening} />
    )
  }

  return (
    <LetterStoryContent
      draft={draft}
      model={model}
      onReveal={revealElement}
      revealedElementIds={revealedElementIds}
    />
  )
}
