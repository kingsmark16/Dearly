'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { regenerateCreatorLetterShareLink } from '../api/regenerate-creator-letter-share-link'
import { creatorLetterQueryKey } from './use-creator-letter'
import { creatorLettersQueryKey } from './use-creator-letters'

export function useRegenerateCreatorLetterShareLink() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: regenerateCreatorLetterShareLink,
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
