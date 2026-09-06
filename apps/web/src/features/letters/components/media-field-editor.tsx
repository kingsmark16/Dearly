'use client'

import type { CreatorMediaAsset } from '@dearly/contracts/letters/media'
import type { CreatorLetterDraft } from '@dearly/contracts'
import axios from 'axios'
import { useState } from 'react'
import { Button } from '@dearly/ui/button'

type DraftField = CreatorLetterDraft['template']['definition']['fields'][number]
type MediaField = Extract<
  DraftField,
  { type: 'photo' | 'photo-gallery' | 'audio' }
>

type MediaFieldEditorProps = {
  field: MediaField
  assets: CreatorMediaAsset[]
  busy: boolean
  onUpload: (
    fieldId: string,
    file: File,
    durationSeconds?: number,
  ) => Promise<void>
  onDelete: (assetId: string) => Promise<void>
  onReorder: (fieldId: string, assetIds: string[]) => Promise<void>
}

function getErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message

    if (typeof message === 'string') {
      return message
    }
  }

  return error instanceof Error ? error.message : fallback
}

function getAudioDuration(file: File): Promise<number> {
  const objectUrl = URL.createObjectURL(file)
  const audio = document.createElement('audio')

  return new Promise((resolve, reject) => {
    const cleanup = () => {
      URL.revokeObjectURL(objectUrl)
      audio.removeAttribute('src')
      audio.load()
    }

    audio.addEventListener('loadedmetadata', () => {
      const duration = audio.duration
      cleanup()

      if (!Number.isFinite(duration) || duration <= 0) {
        reject(new Error('We could not read the audio duration.'))
        return
      }

      resolve(duration)
    })
    audio.addEventListener('error', () => {
      cleanup()
      reject(new Error('We could not read the audio file.'))
    })
    audio.src = objectUrl
    audio.load()
  })
}

function MediaPreview({ asset }: { asset: CreatorMediaAsset }) {
  if (asset.kind === 'audio') {
    return asset.previewUrl ? (
      <audio controls src={asset.previewUrl} className="w-full" />
    ) : (
      <p className="text-sm text-[var(--dearly-muted)]">Uploading audio…</p>
    )
  }

  return asset.previewUrl ? (
    <div
      className="h-40 w-full rounded-xl bg-cover bg-center bg-no-repeat"
      role="img"
      aria-label={asset.originalFileName}
      style={{ backgroundImage: `url(${asset.previewUrl})` }}
    />
  ) : (
    <div className="flex h-40 items-center justify-center rounded-xl bg-[var(--dearly-blush)]/50 text-sm text-[var(--dearly-muted)]">
      Uploading photo…
    </div>
  )
}

export function MediaFieldEditor({
  field,
  assets,
  busy,
  onUpload,
  onDelete,
  onReorder,
}: MediaFieldEditorProps) {
  const [error, setError] = useState<string | null>(null)
  const fieldAssets = assets.filter((asset) => asset.fieldId === field.id)
  const isGallery = field.type === 'photo-gallery'
  const acceptedTypes =
    field.type === 'audio'
      ? 'audio/aac,audio/mpeg,audio/mp4,audio/ogg,audio/wav,audio/webm'
      : 'image/jpeg,image/png,image/webp'

  async function handleFiles(fileList: FileList | null) {
    if (!fileList) {
      return
    }

    setError(null)

    try {
      for (const file of Array.from(fileList)) {
        const durationSeconds =
          field.type === 'audio' ? await getAudioDuration(file) : undefined
        await onUpload(field.id, file, durationSeconds)
      }
    } catch (uploadError: unknown) {
      setError(
        getErrorMessage(uploadError, 'We could not upload this media file.'),
      )
    }
  }

  async function removeAsset(assetId: string) {
    setError(null)

    try {
      await onDelete(assetId)
    } catch (deleteError: unknown) {
      setError(
        getErrorMessage(deleteError, 'We could not remove this media file.'),
      )
    }
  }

  async function moveAsset(assetId: string, offset: -1 | 1) {
    const currentIndex = fieldAssets.findIndex((asset) => asset.id === assetId)
    const nextIndex = currentIndex + offset

    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= fieldAssets.length) {
      return
    }

    const nextAssets = [...fieldAssets]
    const [movedAsset] = nextAssets.splice(currentIndex, 1)
    nextAssets.splice(nextIndex, 0, movedAsset)
    setError(null)

    try {
      await onReorder(
        field.id,
        nextAssets.map((asset) => asset.id),
      )
    } catch (reorderError: unknown) {
      setError(
        getErrorMessage(reorderError, 'We could not save the gallery order.'),
      )
    }
  }

  const canUpload =
    field.type === 'photo' || field.type === 'audio'
      ? fieldAssets.length === 0
      : fieldAssets.length < field.maxItems

  return (
    <div className="rounded-2xl border border-[var(--dearly-blush)] bg-white/60 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-semibold">{field.label}</p>
          <p className="mt-2 text-sm leading-6 text-[var(--dearly-muted)]">
            {field.description ??
              (isGallery
                ? `Add up to ${field.maxItems} photos and arrange them in order.`
                : field.type === 'audio'
                  ? `Add one audio track up to ${field.maxDurationSeconds} seconds.`
                  : 'Add one photo to this Letter.')}
          </p>
        </div>
        <span className="text-sm text-[var(--dearly-muted)]">
          {fieldAssets.length} {isGallery ? `of ${field.maxItems}` : 'file'}
        </span>
      </div>

      {fieldAssets.length > 0 ? (
        <ul className="mt-5 space-y-4" aria-label={`${field.label} uploads`}>
          {fieldAssets.map((asset, index) => (
            <li
              key={asset.id}
              className="rounded-xl border border-[var(--dearly-blush)] p-3"
            >
              <MediaPreview asset={asset} />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm">
                <span className="truncate font-semibold">
                  {asset.originalFileName}
                </span>
                <div className="flex flex-wrap gap-2">
                  {isGallery ? (
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={busy || index === 0}
                        onClick={() => void moveAsset(asset.id, -1)}
                      >
                        Move up
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={busy || index === fieldAssets.length - 1}
                        onClick={() => void moveAsset(asset.id, 1)}
                      >
                        Move down
                      </Button>
                    </>
                  ) : null}
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={busy}
                    onClick={() => void removeAsset(asset.id)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-5 text-sm text-[var(--dearly-muted)]">
          No media added yet.
        </p>
      )}

      {canUpload ? (
        <label className="mt-5 inline-flex cursor-pointer items-center justify-center rounded-full bg-[var(--dearly-ink)] px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[var(--dearly-plum)] has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50">
          {busy ? 'Uploading…' : isGallery ? 'Add photos' : 'Choose file'}
          <input
            className="sr-only"
            type="file"
            accept={acceptedTypes}
            multiple={isGallery}
            disabled={busy}
            aria-label={field.label}
            onChange={(event) => {
              void handleFiles(event.target.files)
              event.currentTarget.value = ''
            }}
          />
        </label>
      ) : null}

      {error ? (
        <p
          className="mt-4 rounded-xl bg-red-50 p-3 text-sm leading-6 text-red-800"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  )
}
