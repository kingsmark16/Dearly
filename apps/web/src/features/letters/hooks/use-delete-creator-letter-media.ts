'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteCreatorLetterMedia } from '../api/delete-creator-letter-media'
import { creatorLetterMediaQueryKey } from './use-creator-letter-media'
import { creatorLetterQueryKey } from './use-creator-letter'

export function useDeleteCreatorLetterMedia(letterId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (assetId: string) =>
      deleteCreatorLetterMedia({ letterId, assetId }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: creatorLetterQueryKey(letterId),
        }),
        queryClient.invalidateQueries({
          queryKey: creatorLetterMediaQueryKey(letterId),
        }),
      ])
    },
  })
}
