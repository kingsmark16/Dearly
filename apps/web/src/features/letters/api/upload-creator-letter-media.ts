import type { CreatorMediaAsset } from '@dearly/contracts/letters/media'
import axios from 'axios'
import { createMediaUploadIntent } from './create-media-upload-intent'
import { completeCreatorLetterMediaUpload } from './complete-creator-letter-media-upload'
import { deleteCreatorLetterMedia } from './delete-creator-letter-media'

export async function uploadCreatorLetterMedia({
  letterId,
  fieldId,
  file,
  durationSeconds,
}: {
  letterId: string
  fieldId: string
  file: File
  durationSeconds?: number
}): Promise<CreatorMediaAsset> {
  const intent = await createMediaUploadIntent({
    letterId,
    input: {
      fieldId,
      fileName: file.name,
      contentType: file.type,
      byteSize: file.size,
      ...(durationSeconds === undefined ? {} : { durationSeconds }),
    },
  })

  try {
    await axios.put(intent.uploadUrl, file, {
      headers: { 'Content-Type': file.type },
      withCredentials: false,
      timeout: 60_000,
    })

    return await completeCreatorLetterMediaUpload({
      letterId,
      assetId: intent.asset.id,
    })
  } catch (error: unknown) {
    await deleteCreatorLetterMedia({
      letterId,
      assetId: intent.asset.id,
    }).catch(() => undefined)
    throw error
  }
}
