'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createLetterDraft } from '../api/create-letter-draft'
import { creatorLettersQueryKey } from './use-creator-letters'

export function useCreateLetterDraft() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createLetterDraft,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: creatorLettersQueryKey })
    },
  })
}
