'use client'

import axios from 'axios'
import { useState } from 'react'
import { Button } from '@dearly/ui/button'
import { useDeleteCreatorAccount } from '../hooks/use-delete-creator-account'

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message

    if (typeof message === 'string') {
      return message
    }
  }

  return 'We could not delete your Creator account. Please try again.'
}

export function CreatorAccountDeletion({
  onDeleted,
}: {
  onDeleted: () => void | Promise<void>
}) {
  const deletionMutation = useDeleteCreatorAccount()
  const [isConfirming, setIsConfirming] = useState(false)
  const [confirmation, setConfirmation] = useState('')

  async function confirmDeletion() {
    try {
      await deletionMutation.mutateAsync({ confirmation })
      await onDeleted()
    } catch {
      // The mutation exposes the server error below. Keeping the confirmation
      // form open lets the Creator correct the input or retry safely.
    }
  }

  const isBusy = deletionMutation.isPending

  return (
    <section
      aria-labelledby="delete-account-heading"
      className="space-y-4 rounded-2xl border border-red-200 bg-red-50/50 p-5"
    >
      <div>
        <h2 id="delete-account-heading" className="text-2xl">
          Delete your Creator account
        </h2>
        <p className="mt-2 text-sm leading-6 text-red-900/75">
          Your Letters and their media will become unavailable immediately.
          Dearly keeps them in recoverable retention for 90 days before
          permanent cleanup.
        </p>
      </div>

      {isConfirming ? (
        <div
          aria-label="Confirm Creator account deletion"
          className="space-y-3"
          role="group"
        >
          <label
            className="block text-sm"
            htmlFor="account-deletion-confirmation"
          >
            <span className="mb-2 block text-red-900/75">
              Type DELETE to confirm
            </span>
            <input
              id="account-deletion-confirmation"
              autoComplete="off"
              className="w-full rounded-xl border border-red-200 bg-white px-4 py-3 outline-none transition focus:border-red-500"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={isBusy || confirmation !== 'DELETE'}
              onClick={() => void confirmDeletion()}
              type="button"
            >
              {isBusy ? 'Deleting account…' : 'Confirm account deletion'}
            </Button>
            <Button
              disabled={isBusy}
              onClick={() => {
                setConfirmation('')
                setIsConfirming(false)
              }}
              type="button"
              variant="ghost"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          onClick={() => setIsConfirming(true)}
          type="button"
          variant="ghost"
        >
          Delete Creator account
        </Button>
      )}

      {deletionMutation.isError ? (
        <p className="text-sm text-red-800" role="alert">
          {getErrorMessage(deletionMutation.error)}
        </p>
      ) : null}
    </section>
  )
}
