'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateCreatorLetterDraft } from '../api/update-creator-letter-draft'
import { creatorLettersQueryKey } from './use-creator-letters'
import { creatorLetterQueryKey } from './use-creator-letter'

export function useUpdateCreatorLetterDraft(letterId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (
      input: Parameters<typeof updateCreatorLetterDraft>[0]['input'],
    ) => updateCreatorLetterDraft({ letterId, input }),
    onSuccess: async (draft) => {
      queryClient.setQueryData(creatorLetterQueryKey(letterId), draft)
      await queryClient.invalidateQueries({ queryKey: creatorLettersQueryKey })
    },
  })
}
