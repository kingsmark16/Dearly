'use client'

import { Button } from '@dearly/ui/button'
import { useState } from 'react'
import { authClient, isGoogleSignInEnabled } from '../auth-client'

export function GoogleSignInButton() {
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isGoogleSignInEnabled) {
    return null
  }

  async function handleGoogleSignIn() {
    setErrorMessage('')
    setIsSubmitting(true)

    try {
      const result = await authClient.signIn.social({
        provider: 'google',
        callbackURL: `${window.location.origin}/creator`,
      })

      if (result.error) {
        setErrorMessage(
          result.error.message ?? 'We could not sign you in with Google.',
        )
        setIsSubmitting(false)
      }
    } catch {
      setErrorMessage('We could not sign you in with Google.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-[var(--dearly-muted)]">
        <span
          aria-hidden="true"
          className="h-px flex-1 bg-[var(--dearly-blush)]"
        />
        <span>or</span>
        <span
          aria-hidden="true"
          className="h-px flex-1 bg-[var(--dearly-blush)]"
        />
      </div>
      <Button
        className="w-full"
        disabled={isSubmitting}
        onClick={handleGoogleSignIn}
        type="button"
        variant="ghost"
      >
        {isSubmitting ? 'Connecting to Google…' : 'Continue with Google'}
      </Button>
      {errorMessage ? (
        <p
          className="rounded-xl bg-red-50 p-4 text-sm leading-6 text-red-800"
          role="alert"
        >
          {errorMessage}
        </p>
      ) : null}
    </div>
  )
}
