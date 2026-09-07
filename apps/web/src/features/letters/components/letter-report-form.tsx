'use client'

import type { LetterReportReason } from '@dearly/contracts/letters/letter-report'
import { LETTER_REPORT_REASONS } from '@dearly/contracts/letters/letter-report'
import { Button } from '@dearly/ui/button'
import axios from 'axios'
import { useState, type FormEvent } from 'react'
import { useReportPublishedLetter } from '../hooks/use-report-published-letter'

const reasonLabels: Record<LetterReportReason, string> = {
  'inappropriate-content': 'Inappropriate or unsafe content',
  'harassment-or-abuse': 'Harassment or abuse',
  'personal-information': 'Personal information shared without permission',
  copyright: 'Copyright concern',
  other: 'Something else',
}

function getReportErrorMessage(error: unknown) {
  if (axios.isAxiosError(error) && error.response?.status === 404) {
    return 'This Letter is no longer available.'
  }

  return 'We could not send your report. Please try again.'
}

export function LetterReportForm({ shareToken }: { shareToken: string }) {
  const reportMutation = useReportPublishedLetter()
  const [isOpen, setIsOpen] = useState(false)
  const [reason, setReason] = useState<LetterReportReason | ''>('')
  const [details, setDetails] = useState('')

  function submitReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!reason) {
      return
    }

    reportMutation.mutate({
      shareToken,
      input: {
        reason,
        details: details.trim() || undefined,
      },
    })
  }

  if (reportMutation.isSuccess) {
    return (
      <p
        className="border-t border-[var(--dearly-blush)] pt-6 text-sm text-[var(--dearly-muted)]"
        role="status"
      >
        Thank you. Your report was received.
      </p>
    )
  }

  if (!isOpen) {
    return (
      <div className="border-t border-[var(--dearly-blush)] pt-6 text-center">
        <Button onClick={() => setIsOpen(true)} type="button" variant="ghost">
          Report this Letter
        </Button>
      </div>
    )
  }

  return (
    <section
      aria-labelledby="letter-report-heading"
      className="border-t border-[var(--dearly-blush)] pt-6 text-left"
    >
      <h2 id="letter-report-heading" className="text-xl">
        Report this Letter
      </h2>
      <p className="mt-2 text-sm leading-6 text-[var(--dearly-muted)]">
        You can report a concern anonymously. You do not need a Dearly account.
      </p>

      <form className="mt-5 space-y-4" onSubmit={submitReport}>
        <div className="space-y-2">
          <label
            className="text-sm font-semibold"
            htmlFor="letter-report-reason"
          >
            Report reason
          </label>
          <select
            className="w-full rounded-xl border border-[var(--dearly-blush)] bg-white px-4 py-3 text-sm focus:outline-2 focus:outline-[var(--dearly-plum)]"
            id="letter-report-reason"
            onChange={(event) =>
              setReason(event.target.value as LetterReportReason | '')
            }
            required
            value={reason}
          >
            <option disabled value="">
              Choose a reason
            </option>
            {LETTER_REPORT_REASONS.map((reportReason) => (
              <option key={reportReason} value={reportReason}>
                {reasonLabels[reportReason]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label
            className="text-sm font-semibold"
            htmlFor="letter-report-details"
          >
            Additional details <span className="font-normal">(optional)</span>
          </label>
          <textarea
            className="min-h-28 w-full rounded-xl border border-[var(--dearly-blush)] bg-white px-4 py-3 text-sm focus:outline-2 focus:outline-[var(--dearly-plum)]"
            id="letter-report-details"
            maxLength={1000}
            onChange={(event) => setDetails(event.target.value)}
            value={details}
          />
        </div>

        {reportMutation.isError ? (
          <p
            className="rounded-xl bg-red-50 p-4 text-sm leading-6 text-red-800"
            role="alert"
          >
            {getReportErrorMessage(reportMutation.error)}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Button disabled={reportMutation.isPending} type="submit">
            {reportMutation.isPending ? 'Sending report…' : 'Submit report'}
          </Button>
          <Button
            disabled={reportMutation.isPending}
            onClick={() => setIsOpen(false)}
            type="button"
            variant="ghost"
          >
            Cancel
          </Button>
        </div>
      </form>
    </section>
  )
}
