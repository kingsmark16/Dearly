'use client'

import { useQuery } from '@tanstack/react-query'
import { getCreatorLetterDraft } from '../api/get-creator-letter-draft'

export const creatorLetterQueryKey = (letterId: string) =>
  ['creator', 'letters', letterId] as const

export function useCreatorLetter(letterId: string) {
  return useQuery({
    queryKey: creatorLetterQueryKey(letterId),
    queryFn: () => getCreatorLetterDraft(letterId),
    enabled: Boolean(letterId),
    retry: false,
  })
}
