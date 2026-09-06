'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { CreatorMediaAsset } from '@dearly/contracts/letters/media'
import { uploadCreatorLetterMedia } from '../api/upload-creator-letter-media'
import { creatorLetterMediaQueryKey } from './use-creator-letter-media'
import { creatorLetterQueryKey } from './use-creator-letter'

export function useUploadCreatorLetterMedia(letterId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      fieldId,
      file,
      durationSeconds,
    }: {
      fieldId: string
      file: File
      durationSeconds?: number
    }) =>
      uploadCreatorLetterMedia({
        letterId,
        fieldId,
        file,
        durationSeconds,
      }),
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

export type UploadMediaMutation = ReturnType<typeof useUploadCreatorLetterMedia>
export type UploadedMediaAsset = CreatorMediaAsset
