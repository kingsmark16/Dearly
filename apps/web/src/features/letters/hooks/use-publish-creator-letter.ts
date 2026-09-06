'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { publishCreatorLetter } from '../api/publish-creator-letter'
import { creatorLetterQueryKey } from './use-creator-letter'
import { creatorLettersQueryKey } from './use-creator-letters'

export function usePublishCreatorLetter() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: publishCreatorLetter,
    onSuccess: async (_result, letterId) => {
      await Promise.all([
        queryClient.invalidateQueries({
          exact: true,
          queryKey: creatorLettersQueryKey,
        }),
        queryClient.invalidateQueries({
          exact: true,
          queryKey: creatorLetterQueryKey(letterId),
        }),
      ])
    },
  })
}
