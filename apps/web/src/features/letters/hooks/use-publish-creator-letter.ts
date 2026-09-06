'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { publishCreatorLetter } from '../api/publish-creator-letter'
import { creatorLettersQueryKey } from './use-creator-letters'

export function usePublishCreatorLetter() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: publishCreatorLetter,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        exact: true,
        queryKey: creatorLettersQueryKey,
      })
    },
  })
}
