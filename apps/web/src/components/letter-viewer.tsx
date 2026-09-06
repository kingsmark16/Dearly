'use client'

import { useState } from 'react'
import type { PublishedLetter } from '@dearly/contracts'
import { Button } from '@dearly/ui/button'

export function LetterViewer({ letter }: { letter: PublishedLetter }) {
  const [isOpen, setIsOpen] = useState(false)

  if (!isOpen) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 py-12">
        <section className="w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/80 bg-white/75 shadow-[0_2rem_6rem_rgb(122_83_110/0.16)] backdrop-blur">
          <div className="relative isolate overflow-hidden px-7 py-20 text-center sm:px-16 sm:py-28">
            <div className="absolute -right-24 -top-24 -z-10 h-72 w-72 rounded-full bg-[var(--dearly-blush)] blur-3xl" />
            <div className="absolute -bottom-28 -left-20 -z-10 h-72 w-72 rounded-full bg-[#eadff0] blur-3xl" />
            <p className="text-sm uppercase tracking-[0.32em] text-[var(--dearly-plum)]">
              {letter.opening.eyebrow}
            </p>
            <h1 className="mx-auto mt-6 max-w-lg text-5xl leading-[1.05] tracking-tight sm:text-7xl">
              {letter.opening.title}
            </h1>
            <p className="mx-auto mt-7 max-w-md text-lg leading-8 text-[var(--dearly-muted)]">
              {letter.opening.subtitle}
            </p>
            <Button className="mt-10" onClick={() => setIsOpen(true)}>
              {letter.opening.ctaLabel}
            </Button>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-12 sm:px-10 sm:py-20">
      <article className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/80 px-6 py-10 shadow-[0_2rem_6rem_rgb(122_83_110/0.12)] sm:px-14 sm:py-16">
        <header className="border-b border-[var(--dearly-blush)] pb-10">
          <p className="text-sm uppercase tracking-[0.32em] text-[var(--dearly-plum)]">
            {letter.category}
          </p>
          <h1 className="mt-5 text-4xl leading-tight sm:text-6xl">
            {letter.opening.title}
          </h1>
        </header>

        <div className="space-y-14 py-12">
          {letter.elements.map((element) => (
            <section key={element.id} aria-labelledby={`${element.id}-heading`}>
              <h2
                id={`${element.id}-heading`}
                className="text-3xl leading-tight sm:text-4xl"
              >
                {element.heading}
              </h2>
              <p className="mt-5 text-lg leading-9 text-[var(--dearly-muted)] sm:text-xl">
                {element.body}
              </p>
            </section>
          ))}
        </div>

        <footer className="border-t border-[var(--dearly-blush)] pt-8 text-center text-sm text-[var(--dearly-muted)]">
          Made with care on Dearly.
        </footer>
      </article>
    </main>
  )
}
