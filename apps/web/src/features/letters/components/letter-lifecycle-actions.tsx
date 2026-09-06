'use client'

import type { CreatorLetterSummary } from '@dearly/contracts/letters/creator-letter'
import axios from 'axios'
import { useState } from 'react'
import { Button } from '@dearly/ui/button'
import { useChangeCreatorLetterLifecycle } from '../hooks/use-change-creator-letter-lifecycle'

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message

    if (typeof message === 'string') {
      return message
    }
  }

  return 'We could not update this Letter. Please try again.'
}

export function LetterLifecycleActions({
  letterId,
  status,
}: {
  letterId: string
  status: CreatorLetterSummary['status']
}) {
  const lifecycleMutation = useChangeCreatorLetterLifecycle()
  const [isConfirmingPermanentDelete, setIsConfirmingPermanentDelete] =
    useState(false)

  function changeLifecycle(action: 'archive' | 'restore' | 'trash') {
    lifecycleMutation.mutate(
      { letterId, action },
      {
        onSuccess: () => setIsConfirmingPermanentDelete(false),
      },
    )
  }

  function permanentlyDelete() {
    lifecycleMutation.mutate(
      { letterId, action: 'permanent-delete', confirmation: 'DELETE' },
      {
        onSuccess: () => setIsConfirmingPermanentDelete(false),
      },
    )
  }

  const isBusy = lifecycleMutation.isPending

  return (
    <div className="mt-4 space-y-3">
      <div className="flex flex-wrap gap-2">
        {status === 'draft' ||
        status === 'published' ||
        status === 'archived' ? (
          <Button
            disabled={isBusy}
            onClick={() =>
              changeLifecycle(status === 'archived' ? 'restore' : 'archive')
            }
            type="button"
            variant="ghost"
          >
            {status === 'archived' ? 'Restore' : 'Archive'}
          </Button>
        ) : null}

        {status === 'draft' ||
        status === 'published' ||
        status === 'archived' ? (
          <Button
            disabled={isBusy}
            onClick={() => changeLifecycle('trash')}
            type="button"
            variant="ghost"
          >
            Move to Trash
          </Button>
        ) : null}

        {status === 'trashed' ? (
          <>
            <Button
              disabled={isBusy}
              onClick={() => changeLifecycle('restore')}
              type="button"
              variant="ghost"
            >
              Restore
            </Button>
            {isConfirmingPermanentDelete ? (
              <div
                className="flex flex-wrap items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-800"
                role="group"
                aria-label="Confirm permanent deletion"
              >
                <span>Permanent deletion cannot be undone.</span>
                <Button
                  disabled={isBusy}
                  onClick={permanentlyDelete}
                  type="button"
                >
                  Confirm permanent delete
                </Button>
                <Button
                  disabled={isBusy}
                  onClick={() => setIsConfirmingPermanentDelete(false)}
                  type="button"
                  variant="ghost"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                disabled={isBusy}
                onClick={() => setIsConfirmingPermanentDelete(true)}
                type="button"
                variant="ghost"
              >
                Permanently delete
              </Button>
            )}
          </>
        ) : null}
      </div>

      {lifecycleMutation.isError ? (
        <p className="text-sm text-red-800" role="alert">
          {getErrorMessage(lifecycleMutation.error)}
        </p>
      ) : null}
    </div>
  )
}
