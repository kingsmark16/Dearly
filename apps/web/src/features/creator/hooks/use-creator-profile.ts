'use client'

import { useQuery } from '@tanstack/react-query'
import { getCreatorProfile } from '../api/get-creator-profile'

export const creatorProfileQueryKey = ['creator', 'profile'] as const

export function useCreatorProfile() {
  return useQuery({
    queryKey: creatorProfileQueryKey,
    queryFn: getCreatorProfile,
    retry: false,
  })
}
