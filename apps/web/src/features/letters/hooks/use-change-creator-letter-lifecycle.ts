'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { changeCreatorLetterLifecycle } from '../api/change-creator-letter-lifecycle'
import { creatorLetterMediaQueryKey } from './use-creator-letter-media'
import { creatorLetterQueryKey } from './use-creator-letter'
import { creatorLettersQueryKey } from './use-creator-letters'

export function useChangeCreatorLetterLifecycle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: changeCreatorLetterLifecycle,
    onSuccess: async (_result, input) => {
      await Promise.all([
        queryClient.invalidateQueries({
          exact: true,
          queryKey: creatorLettersQueryKey,
        }),
        queryClient.invalidateQueries({
          exact: true,
          queryKey: creatorLetterQueryKey(input.letterId),
        }),
        queryClient.invalidateQueries({
          exact: true,
          queryKey: creatorLetterMediaQueryKey(input.letterId),
        }),
      ])
    },
  })
}
