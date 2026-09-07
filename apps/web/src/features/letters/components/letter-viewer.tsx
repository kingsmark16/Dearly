'use client'

import type { PublishedLetter } from '@dearly/contracts'
import Image from 'next/image'
import { Button } from '@dearly/ui/button'
import { useState } from 'react'
import { LetterReportForm } from './letter-report-form'

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

function StoryElement({
  element,
  isRevealed,
  onReveal,
}: {
  element: PublishedLetter['elements'][number]
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
            src={element.url}
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
            {element.photos.map((photo, index) => (
              <li key={photo.id} className="overflow-hidden rounded-2xl">
                <Image
                  alt={photo.alt}
                  className="aspect-[4/3] w-full object-cover"
                  height={600}
                  src={photo.url}
                  unoptimized
                  width={800}
                  priority={index === 0}
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
  }
}

export function LetterViewer({
  letter,
  reportSlug,
}: {
  letter: PublishedLetter
  reportSlug?: string | null
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [revealedElementIds, setRevealedElementIds] = useState<Set<string>>(
    () => new Set(),
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
      <main className="flex min-h-screen items-center justify-center px-6 py-12">
        <section
          aria-labelledby="letter-opening-title"
          className="w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/80 bg-white/75 shadow-[0_2rem_6rem_rgb(122_83_110/0.16)] backdrop-blur"
          data-viewer-stage="opening"
        >
          <div className="relative isolate overflow-hidden px-7 py-20 text-center sm:px-16 sm:py-28">
            <div className="absolute -right-24 -top-24 -z-10 h-72 w-72 rounded-full bg-[var(--dearly-blush)] blur-3xl" />
            <div className="absolute -bottom-28 -left-20 -z-10 h-72 w-72 rounded-full bg-[#eadff0] blur-3xl" />
            <p className="text-sm uppercase tracking-[0.32em] text-[var(--dearly-plum)]">
              {letter.opening.eyebrow}
            </p>
            <h1
              id="letter-opening-title"
              className="mx-auto mt-6 max-w-lg text-5xl leading-[1.05] tracking-tight sm:text-7xl"
            >
              {letter.opening.title}
            </h1>
            <p className="mx-auto mt-7 max-w-md text-lg leading-8 text-[var(--dearly-muted)]">
              {letter.opening.subtitle}
            </p>
            <Button
              className="mt-10"
              onClick={() => setIsOpen(true)}
              type="button"
            >
              {letter.opening.ctaLabel}
            </Button>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-12 sm:px-10 sm:py-20">
      <article
        className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/80 px-6 py-10 shadow-[0_2rem_6rem_rgb(122_83_110/0.12)] sm:px-14 sm:py-16"
        data-viewer-stage="story"
      >
        <header className="border-b border-[var(--dearly-blush)] pb-10">
          <p className="text-sm uppercase tracking-[0.32em] text-[var(--dearly-plum)]">
            {letter.category}
          </p>
          <h1 className="mt-5 text-4xl leading-tight sm:text-6xl">
            {letter.opening.title}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--dearly-muted)]">
            {letter.opening.subtitle}
          </p>
        </header>

        <div className="space-y-14 py-12">
          {letter.elements.map((element) => (
            <StoryElement
              element={element}
              isRevealed={revealedElementIds.has(element.id)}
              key={element.id}
              onReveal={revealElement}
            />
          ))}
        </div>

        <footer className="border-t border-[var(--dearly-blush)] pt-8 text-center text-sm text-[var(--dearly-muted)]">
          Made with care on Dearly.
        </footer>

        {reportSlug ? <LetterReportForm shareToken={reportSlug} /> : null}
      </article>
    </main>
  )
}
