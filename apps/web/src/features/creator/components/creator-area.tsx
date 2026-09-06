'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { useCatalog } from '../../catalog/hooks/use-catalog'
import { Button } from '@dearly/ui/button'
import { authClient } from '../../auth/auth-client'
import { useCreatorProfile } from '../hooks/use-creator-profile'
import { CreatorTemplatePicker } from './creator-template-picker'
import { useCreateLetterDraft } from '../../letters/hooks/use-create-letter-draft'
import { useCreatorLetters } from '../../letters/hooks/use-creator-letters'
import { CreatorLetterList } from '../../letters/components/creator-letter-list'

export function CreatorArea() {
  const router = useRouter()
  const profileQuery = useCreatorProfile()
  const catalogQuery = useCatalog()
  const lettersQuery = useCreatorLetters(Boolean(profileQuery.data))
  const createDraftMutation = useCreateLetterDraft()
  const [selectedTemplateSlug, setSelectedTemplateSlug] = useState<
    string | null
  >(null)
  const [isSigningOut, setIsSigningOut] = useState(false)

  useEffect(() => {
    if (
      axios.isAxiosError(profileQuery.error) &&
      profileQuery.error.response?.status === 401
    ) {
      router.replace('/sign-in')
    }
  }, [profileQuery.error, router])

  async function handleSignOut() {
    setIsSigningOut(true)
    try {
      await authClient.signOut()
      router.replace('/sign-in')
    } finally {
      setIsSigningOut(false)
    }
  }

  function handleCreateDraft(templateSlug: string) {
    setSelectedTemplateSlug(templateSlug)
    createDraftMutation.mutate(
      { templateSlug },
      {
        onSuccess: (draft) => {
          setSelectedTemplateSlug(null)
          router.push(`/creator/letters/${draft.id}`)
        },
      },
    )
  }

  if (profileQuery.isLoading) {
    return (
      <p className="text-[var(--dearly-muted)]">Loading your Creator area…</p>
    )
  }

  if (
    axios.isAxiosError(profileQuery.error) &&
    profileQuery.error.response?.status === 401
  ) {
    return null
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <p
        className="rounded-xl bg-red-50 p-4 text-sm leading-6 text-red-800"
        role="alert"
      >
        We could not load your Creator session. Please sign in again.
      </p>
    )
  }

  const creator = profileQuery.data.creator
  const createError =
    axios.isAxiosError(createDraftMutation.error) &&
    createDraftMutation.error.response?.status === 404
      ? 'That template is no longer available. Please refresh and try again.'
      : 'We could not create the Draft. Please try again.'

  return (
    <div className="space-y-8">
      <div className="rounded-2xl bg-[var(--dearly-blush)]/60 p-5">
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--dearly-plum)]">
          Verified Creator
        </p>
        <h2 className="mt-3 text-3xl">Welcome, {creator.name}</h2>
        <p className="mt-2 text-[var(--dearly-muted)]">{creator.email}</p>
      </div>

      <section className="space-y-5" aria-labelledby="choose-template-heading">
        <div>
          <h2 id="choose-template-heading" className="text-3xl">
            Choose a template
          </h2>
          <p className="mt-2 leading-7 text-[var(--dearly-muted)]">
            Start a Draft from a Dearly template. You can personalize its Fields
            and Elements in the editor next.
          </p>
        </div>

        {catalogQuery.isLoading ? (
          <p className="text-[var(--dearly-muted)]">Loading templates…</p>
        ) : catalogQuery.isError || !catalogQuery.data ? (
          <p
            className="rounded-xl bg-red-50 p-4 text-sm leading-6 text-red-800"
            role="alert"
          >
            We could not load the template library. Please try again.
          </p>
        ) : (
          <CreatorTemplatePicker
            categories={catalogQuery.data.categories}
            isCreating={createDraftMutation.isPending}
            onSelect={handleCreateDraft}
            selectedTemplateSlug={selectedTemplateSlug}
            templates={catalogQuery.data.templates}
          />
        )}

        {createDraftMutation.isError ? (
          <p
            className="rounded-xl bg-red-50 p-4 text-sm leading-6 text-red-800"
            role="alert"
          >
            {createError}
          </p>
        ) : null}
      </section>

      <section className="space-y-4" aria-labelledby="your-letters-heading">
        <div>
          <h2 id="your-letters-heading" className="text-3xl">
            Your Letters
          </h2>
          <p className="mt-2 text-[var(--dearly-muted)]">
            Drafts are private. Published Letters stay available through their
            unlisted Share link while you prepare any future updates.
          </p>
        </div>

        {lettersQuery.isLoading ? (
          <p className="text-[var(--dearly-muted)]">Loading your Letters…</p>
        ) : lettersQuery.isError ? (
          <p
            className="rounded-xl bg-red-50 p-4 text-sm leading-6 text-red-800"
            role="alert"
          >
            We could not load your Letters. Please try again.
          </p>
        ) : lettersQuery.data ? (
          <CreatorLetterList letters={lettersQuery.data} />
        ) : null}
      </section>

      <Button disabled={isSigningOut} onClick={handleSignOut} type="button">
        {isSigningOut ? 'Signing out…' : 'Sign out'}
      </Button>
    </div>
  )
}
