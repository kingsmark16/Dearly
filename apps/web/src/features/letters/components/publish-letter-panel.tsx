'use client'

import type { PublishLetterResponse } from '@dearly/contracts/letters/publish-letter'
import axios from 'axios'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { Button } from '@dearly/ui/button'
import { usePublishCreatorLetter } from '../hooks/use-publish-creator-letter'

type PublishProblem = {
  fieldId: string
  fieldLabel: string
  message: string
}

type PublishLetterPanelProps = {
  letterId: string
  beforePublish: () => Promise<void>
}

function getPublishProblems(error: unknown): PublishProblem[] {
  if (!axios.isAxiosError(error)) {
    return []
  }

  const problems = error.response?.data?.problems

  if (!Array.isArray(problems)) {
    return []
  }

  return problems.filter(
    (problem): problem is PublishProblem =>
      typeof problem?.fieldId === 'string' &&
      typeof problem?.fieldLabel === 'string' &&
      typeof problem?.message === 'string',
  )
}

function getPublishErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message

    if (typeof message === 'string') {
      return message
    }
  }

  return error instanceof Error
    ? error.message
    : 'We could not publish this Letter. Please try again.'
}

function ShareLinkTools({ result }: { result: PublishLetterResponse }) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>(
    'idle',
  )
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [qrError, setQrError] = useState<string | null>(null)

  useEffect(() => {
    let isCurrent = true

    void import('qrcode')
      .then((qrcode) =>
        qrcode.toDataURL(result.shareUrl, {
          errorCorrectionLevel: 'M',
          margin: 2,
          width: 320,
        }),
      )
      .then((dataUrl) => {
        if (isCurrent) {
          setQrDataUrl(dataUrl)
        }
      })
      .catch(() => {
        if (isCurrent) {
          setQrError(
            'We could not create the QR code. You can still copy the link.',
          )
        }
      })

    return () => {
      isCurrent = false
    }
  }, [result.shareUrl])

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(result.shareUrl)
      setCopyState('copied')
    } catch {
      setCopyState('error')
    }
  }

  return (
    <div className="space-y-6" data-testid="published-share-tools">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--dearly-plum)]">
          Your Letter is live
        </p>
        <h3 className="mt-2 text-2xl">Share it privately</h3>
        <p className="mt-2 text-sm leading-6 text-[var(--dearly-muted)]">
          Anyone with this unlisted link can read the Letter. It is not listed
          in Dearly search or public galleries.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          aria-label="Letter Share link"
          className="min-w-0 flex-1 rounded-xl border border-[var(--dearly-blush)] bg-white px-4 py-3 text-sm"
          data-share-url={result.shareUrl}
          readOnly
          value={result.shareUrl}
        />
        <Button onClick={() => void copyShareLink()} type="button">
          {copyState === 'copied' ? 'Copied' : 'Copy link'}
        </Button>
      </div>

      {copyState === 'error' ? (
        <p className="text-sm text-red-800" role="alert">
          Copying was blocked by the browser. Select the link and copy it
          manually.
        </p>
      ) : null}

      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <div
          aria-label="QR code for the Letter Share link"
          className="flex min-h-40 min-w-40 items-center justify-center rounded-2xl bg-white p-3 shadow-sm"
          data-qr-value={result.shareUrl}
        >
          {qrDataUrl ? (
            <Image
              alt="QR code for the Letter Share link"
              className="h-40 w-40"
              height={320}
              src={qrDataUrl}
              unoptimized
              width={320}
            />
          ) : (
            <span className="px-4 text-center text-sm text-[var(--dearly-muted)]">
              Creating QR code…
            </span>
          )}
        </div>
        <div className="space-y-3">
          <p className="text-sm leading-6 text-[var(--dearly-muted)]">
            Scan this QR code to open the exact same Share link.
          </p>
          {qrDataUrl ? (
            <a
              className="inline-flex rounded-full border border-[var(--dearly-ink)] px-5 py-2.5 text-sm font-semibold transition hover:-translate-y-0.5 hover:bg-[var(--dearly-ink)] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--dearly-plum)]"
              download="dearly-letter-qr.png"
              href={qrDataUrl}
            >
              Download QR code
            </a>
          ) : null}
          {qrError ? (
            <p className="text-sm text-red-800" role="alert">
              {qrError}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function PublishLetterPanel({
  letterId,
  beforePublish,
}: PublishLetterPanelProps) {
  const publishMutation = usePublishCreatorLetter()
  const [result, setResult] = useState<PublishLetterResponse | null>(null)
  const [error, setError] = useState<unknown>(null)

  async function handlePublish() {
    setError(null)

    try {
      await beforePublish()
      const published = await publishMutation.mutateAsync(letterId)
      setResult(published)
    } catch (publishError: unknown) {
      setError(publishError)
    }
  }

  const problems = getPublishProblems(error)

  return (
    <section
      aria-labelledby="publish-letter-heading"
      className="space-y-6 rounded-2xl border border-[var(--dearly-blush)] bg-[var(--dearly-blush)]/20 p-6"
      data-testid="publish-letter-panel"
    >
      {result ? (
        <ShareLinkTools result={result} />
      ) : (
        <>
          <div>
            <h2 id="publish-letter-heading" className="text-2xl">
              Publish your Letter
            </h2>
            <p className="mt-2 leading-7 text-[var(--dearly-muted)]">
              Publishing activates one unlisted Share link. Required Fields,
              media uploads, and Template limits are checked first.
            </p>
          </div>

          {error ? (
            <div
              className="space-y-3 rounded-xl bg-red-50 p-4 text-sm leading-6 text-red-800"
              role="alert"
            >
              <p>{getPublishErrorMessage(error)}</p>
              {problems.length > 0 ? (
                <ul className="list-disc space-y-1 pl-5">
                  {problems.map((problem) => (
                    <li key={`${problem.fieldId}-${problem.message}`}>
                      <span className="font-semibold">
                        {problem.fieldLabel}:
                      </span>{' '}
                      {problem.message}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          <Button
            disabled={publishMutation.isPending}
            onClick={() => void handlePublish()}
            type="button"
          >
            {publishMutation.isPending ? 'Publishing…' : 'Publish Letter'}
          </Button>
        </>
      )}
    </section>
  )
}
