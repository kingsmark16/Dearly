'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { Button } from '@dearly/ui/button'
import { authClient } from '../auth-client'

export function SignUpForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.')
      return
    }

    setIsSubmitting(true)
    const result = await authClient.signUp.email({
      name,
      email,
      password,
      callbackURL: `${window.location.origin}/creator`,
    })
    setIsSubmitting(false)

    if (result.error) {
      setErrorMessage(
        result.error.message ?? 'We could not create your Creator account.',
      )
      return
    }

    setIsSubmitted(true)
  }

  if (isSubmitted) {
    return (
      <div className="space-y-5" role="status">
        <p className="rounded-2xl bg-[var(--dearly-blush)]/60 p-5 leading-7">
          Check your email for a verification link. You must verify your email
          before you can enter the Creator area.
        </p>
        <p className="text-sm leading-6 text-[var(--dearly-muted)]">
          Already verified?{' '}
          <Link
            className="text-[var(--dearly-plum)] underline underline-offset-4"
            href="/sign-in"
          >
            Sign in
          </Link>
          .
        </p>
      </div>
    )
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <label className="block text-sm">
        <span className="mb-2 block text-[var(--dearly-muted)]">Name</span>
        <input
          required
          autoComplete="name"
          className="w-full rounded-xl border border-[var(--dearly-blush)] bg-white px-4 py-3 outline-none transition focus:border-[var(--dearly-plum)]"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </label>
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
          minLength={8}
          type="password"
          autoComplete="new-password"
          className="w-full rounded-xl border border-[var(--dearly-blush)] bg-white px-4 py-3 outline-none transition focus:border-[var(--dearly-plum)]"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>
      <label className="block text-sm">
        <span className="mb-2 block text-[var(--dearly-muted)]">
          Confirm password
        </span>
        <input
          required
          minLength={8}
          type="password"
          autoComplete="new-password"
          className="w-full rounded-xl border border-[var(--dearly-blush)] bg-white px-4 py-3 outline-none transition focus:border-[var(--dearly-plum)]"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
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
        {isSubmitting ? 'Creating account…' : 'Create Creator account'}
      </Button>
      <p className="text-center text-sm leading-6 text-[var(--dearly-muted)]">
        Already have an account?{' '}
        <Link
          className="text-[var(--dearly-plum)] underline underline-offset-4"
          href="/sign-in"
        >
          Sign in
        </Link>
        .
      </p>
    </form>
  )
}
