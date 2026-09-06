'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { Button } from '@dearly/ui/button'
import { authClient } from '../../auth/auth-client'
import { getCreatorProfile } from '../api/get-creator-profile'

export function CreatorArea() {
  const router = useRouter()
  const [creatorName, setCreatorName] = useState('')
  const [creatorEmail, setCreatorEmail] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSigningOut, setIsSigningOut] = useState(false)

  useEffect(() => {
    let isMounted = true

    getCreatorProfile()
      .then(({ creator }) => {
        if (!isMounted) return
        setCreatorName(creator.name)
        setCreatorEmail(creator.email)
        setIsLoading(false)
      })
      .catch((error: unknown) => {
        if (!isMounted) return
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          router.replace('/sign-in')
          return
        }
        setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [router])

  async function handleSignOut() {
    setIsSigningOut(true)
    await authClient.signOut()
    router.replace('/sign-in')
  }

  if (isLoading) {
    return (
      <p className="text-[var(--dearly-muted)]">Loading your Creator area…</p>
    )
  }

  if (!creatorEmail) {
    return (
      <p
        className="rounded-xl bg-red-50 p-4 text-sm leading-6 text-red-800"
        role="alert"
      >
        We could not load your Creator session. Please sign in again.
      </p>
    )
  }

  return (
    <div className="space-y-8">
      <div className="rounded-2xl bg-[var(--dearly-blush)]/60 p-5">
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--dearly-plum)]">
          Verified Creator
        </p>
        <h2 className="mt-3 text-3xl">Welcome, {creatorName}</h2>
        <p className="mt-2 text-[var(--dearly-muted)]">{creatorEmail}</p>
      </div>
      <p className="leading-7 text-[var(--dearly-muted)]">
        Your Creator workspace is ready. The next slice will let you create a
        Draft letter from a category and template.
      </p>
      <Button disabled={isSigningOut} onClick={handleSignOut} type="button">
        {isSigningOut ? 'Signing out…' : 'Sign out'}
      </Button>
    </div>
  )
}
