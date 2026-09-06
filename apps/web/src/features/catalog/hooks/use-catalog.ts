'use client'

import { useQuery } from '@tanstack/react-query'
import { getCatalogForBrowser } from '../api/get-catalog-for-browser'

export const catalogQueryKey = ['catalog'] as const

export function useCatalog() {
  return useQuery({
    queryKey: catalogQueryKey,
    queryFn: getCatalogForBrowser,
    staleTime: 5 * 60 * 1000,
  })
}
