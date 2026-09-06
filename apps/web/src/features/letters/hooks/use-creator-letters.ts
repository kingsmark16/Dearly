'use client'

import { useQuery } from '@tanstack/react-query'
import { getCreatorLetters } from '../api/get-creator-letters'

export const creatorLettersQueryKey = ['creator', 'letters'] as const

export function useCreatorLetters(enabled: boolean) {
  return useQuery({
    queryKey: creatorLettersQueryKey,
    queryFn: getCreatorLetters,
    enabled,
  })
}
