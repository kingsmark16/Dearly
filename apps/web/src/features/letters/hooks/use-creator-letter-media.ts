'use client'

import { useQuery } from '@tanstack/react-query'
import { getCreatorLetterMedia } from '../api/get-creator-letter-media'

export const creatorLetterMediaQueryKey = (letterId: string) =>
  ['creator', 'letters', letterId, 'media'] as const

export function useCreatorLetterMedia(letterId: string) {
  return useQuery({
    queryKey: creatorLetterMediaQueryKey(letterId),
    queryFn: () => getCreatorLetterMedia(letterId),
  })
}
