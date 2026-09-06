'use client'

import { useEffect } from 'react'
import { Button } from '@dearly/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-6 text-center">
      <p className="text-sm uppercase tracking-[0.3em] text-[var(--dearly-plum)]">
        Dearly
      </p>
      <h1 className="mt-4 text-4xl">This letter could not be loaded.</h1>
      <p className="mt-4 text-[var(--dearly-muted)]">
        Please try again. If the problem continues, the link may be temporarily
        unavailable.
      </p>
      <Button className="mt-8" onClick={() => reset()}>
        Try again
      </Button>
    </main>
  )
}
