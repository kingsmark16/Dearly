'use client'

import { useMutation } from '@tanstack/react-query'
import { reportPublishedLetter } from '../api/report-published-letter'

export function useReportPublishedLetter() {
  return useMutation({
    mutationFn: ({
      shareToken,
      input,
    }: {
      shareToken: string
      input: Parameters<typeof reportPublishedLetter>[1]
    }) => reportPublishedLetter(shareToken, input),
  })
}
