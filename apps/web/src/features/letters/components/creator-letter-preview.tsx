'use client'

import axios from 'axios'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LetterStory } from './letter-story/letter-story'
import { useCreatorLetter } from '../hooks/use-creator-letter'
import { useCreatorLetterMedia } from '../hooks/use-creator-letter-media'

function PreviewLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <p className="text-[var(--dearly-muted)]">
        Loading your private preview...
      </p>
    </main>
  )
}

function PreviewError() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <p
        className="w-full max-w-lg rounded-xl bg-red-50 p-4 text-sm leading-6 text-red-800"
        role="alert"
      >
        This Draft is unavailable or you do not have permission to preview it.
      </p>
    </main>
  )
}

export function CreatorLetterPreview({ letterId }: { letterId: string }) {
  const router = useRouter()
  const draftQuery = useCreatorLetter(letterId)
  const mediaQuery = useCreatorLetterMedia(letterId)
  const draftUnauthorized =
    axios.isAxiosError(draftQuery.error) &&
    draftQuery.error.response?.status === 401
  const mediaUnauthorized =
    axios.isAxiosError(mediaQuery.error) &&
    mediaQuery.error.response?.status === 401

  useEffect(() => {
    if (draftUnauthorized || mediaUnauthorized) {
      router.replace('/sign-in')
    }
  }, [draftUnauthorized, mediaUnauthorized, router])

  if (draftUnauthorized || mediaUnauthorized) {
    return null
  }

  if (draftQuery.isLoading || mediaQuery.isLoading) {
    return <PreviewLoading />
  }

  if (
    draftQuery.isError ||
    !draftQuery.data ||
    mediaQuery.isError ||
    !mediaQuery.data
  ) {
    return <PreviewError />
  }

  return <LetterStory draft={draftQuery.data} mediaAssets={mediaQuery.data} />
}
