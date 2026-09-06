'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@dearly/ui/button'
import { authClient } from '../lib/auth-client'

export function SignInForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')
    setIsSubmitting(true)

    const result = await authClient.signIn.email({
      email,
      password,
      callbackURL: `${window.location.origin}/creator`,
    })
    setIsSubmitting(false)

    if (result.error) {
      setErrorMessage(
        result.error.status === 403
          ? 'Please verify your email before signing in.'
          : (result.error.message ?? 'The email or password is not correct.'),
      )
      return
    }

    router.push('/creator')
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <label className="block text-sm">
        <span className="mb-2 block text-[var(--dearly-muted)]">Email</span>
        <input
          required
          type="email"
          autoComplete="email"
          className="w-full rounded-xl border border-[var(--dearly-blush)] bg-white px-4 py-3 outline-none transition focus:border-[var(--dearly-plum)]"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>
      <label className="block text-sm">
        <span className="mb-2 block text-[var(--dearly-muted)]">Password</span>
        <input
          required
          type="password"
          autoComplete="current-password"
          className="w-full rounded-xl border border-[var(--dearly-blush)] bg-white px-4 py-3 outline-none transition focus:border-[var(--dearly-plum)]"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>
      {errorMessage ? (
        <p
          className="rounded-xl bg-red-50 p-4 text-sm leading-6 text-red-800"
          role="alert"
        >
          {errorMessage}
        </p>
      ) : null}
      <Button className="w-full" disabled={isSubmitting} type="submit">
        {isSubmitting ? 'Signing in…' : 'Sign in'}
      </Button>
      <p className="text-center text-sm leading-6 text-[var(--dearly-muted)]">
        New to Dearly?{' '}
        <Link
          className="text-[var(--dearly-plum)] underline underline-offset-4"
          href="/sign-up"
        >
          Create an account
        </Link>
        .
      </p>
    </form>
  )
}
