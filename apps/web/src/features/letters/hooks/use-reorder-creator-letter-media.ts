'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { reorderCreatorLetterMedia } from '../api/reorder-creator-letter-media'
import { creatorLetterMediaQueryKey } from './use-creator-letter-media'
import { creatorLetterQueryKey } from './use-creator-letter'

export function useReorderCreatorLetterMedia(letterId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      fieldId,
      assetIds,
    }: {
      fieldId: string
      assetIds: string[]
    }) => reorderCreatorLetterMedia({ letterId, fieldId, assetIds }),
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
