'use client'

import type { CreatorLetterDraft } from '@dearly/contracts'
import type { CreatorMediaAsset } from '@dearly/contracts/letters/media'
import axios from 'axios'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@dearly/ui/button'
import { MediaFieldEditor } from './media-field-editor'
import { useCreatorLetter } from '../hooks/use-creator-letter'
import { useCreatorLetterMedia } from '../hooks/use-creator-letter-media'
import { useDeleteCreatorLetterMedia } from '../hooks/use-delete-creator-letter-media'
import { useReorderCreatorLetterMedia } from '../hooks/use-reorder-creator-letter-media'
import { useUploadCreatorLetterMedia } from '../hooks/use-upload-creator-letter-media'
import { useUpdateCreatorLetterDraft } from '../hooks/use-update-creator-letter-draft'
import { PublishLetterPanel } from './publish-letter-panel'

type EditorState = {
  title: string
  content: Record<string, unknown>
}

type SaveState = 'saved' | 'saving' | 'error'

type DraftField = CreatorLetterDraft['template']['definition']['fields'][number]

function isEditableField(field: DraftField) {
  return (
    field.type === 'text' ||
    field.type === 'rich-text' ||
    field.type === 'recipient-name'
  )
}

function getTextValue(content: Record<string, unknown>, fieldId: string) {
  const value = content[fieldId]
  return typeof value === 'string' ? value : ''
}

function createEditorState(draft: CreatorLetterDraft): EditorState {
  return {
    title: draft.title,
    content: { ...draft.content },
  }
}

function serializeEditorState(state: EditorState) {
  return JSON.stringify(state)
}

function updateMediaContent(
  draft: CreatorLetterDraft,
  content: Record<string, unknown>,
  asset: CreatorMediaAsset,
) {
  const field = draft.template.definition.fields.find(
    (candidate) => candidate.id === asset.fieldId,
  )
  const nextContent = { ...content }

  if (field?.type === 'photo-gallery') {
    const currentValue = content[asset.fieldId]
    const assetIds = Array.isArray(currentValue)
      ? currentValue.filter(
          (value): value is string => typeof value === 'string',
        )
      : []

    if (!assetIds.includes(asset.id)) {
      assetIds.push(asset.id)
    }

    nextContent[asset.fieldId] = assetIds
  } else {
    nextContent[asset.fieldId] = asset.id
  }

  return nextContent
}

function removeMediaContent(
  content: Record<string, unknown>,
  asset: CreatorMediaAsset,
) {
  const nextContent = { ...content }
  const currentValue = content[asset.fieldId]

  if (Array.isArray(currentValue)) {
    const assetIds = currentValue.filter(
      (value): value is string =>
        typeof value === 'string' && value !== asset.id,
    )

    if (assetIds.length > 0) {
      nextContent[asset.fieldId] = assetIds
    } else {
      delete nextContent[asset.fieldId]
    }
  } else if (currentValue === asset.id) {
    delete nextContent[asset.fieldId]
  }

  return nextContent
}

function setMediaOrder(
  content: Record<string, unknown>,
  fieldId: string,
  assetIds: string[],
) {
  return { ...content, [fieldId]: [...assetIds] }
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message

    if (typeof message === 'string') {
      return message
    }
  }

  return error instanceof Error ? error.message : fallback
}

export function DraftEditor({ letterId }: { letterId: string }) {
  const router = useRouter()
  const draftQuery = useCreatorLetter(letterId)
  const mediaQuery = useCreatorLetterMedia(letterId)
  const draftUnauthorized =
    axios.isAxiosError(draftQuery.error) &&
    draftQuery.error.response?.status === 401
  const mediaUnauthorized =
    axios.isAxiosError(mediaQuery.error) &&
    mediaQuery.error.response?.status === 401

  useEffect(() => {
    if (draftUnauthorized || mediaUnauthorized) {
      router.replace('/sign-in')
    }
  }, [draftUnauthorized, mediaUnauthorized, router])

  if (draftUnauthorized || mediaUnauthorized) {
    return null
  }

  if (draftQuery.isError) {
    return (
      <p
        className="rounded-xl bg-red-50 p-4 text-sm leading-6 text-red-800"
        role="alert"
      >
        This Draft is unavailable or you do not have permission to edit it.
      </p>
    )
  }

  if (draftQuery.isLoading || !draftQuery.data) {
    return <p className="text-[var(--dearly-muted)]">Loading your Draft…</p>
  }

  return (
    <DraftEditorForm
      key={letterId}
      draft={draftQuery.data}
      mediaAssets={mediaQuery.data ?? []}
      mediaError={
        mediaQuery.isError
          ? getApiErrorMessage(
              mediaQuery.error,
              'We could not load your media files.',
            )
          : null
      }
      letterId={letterId}
    />
  )
}

function DraftEditorForm({
  draft,
  mediaAssets,
  mediaError,
  letterId,
}: {
  draft: CreatorLetterDraft
  mediaAssets: CreatorMediaAsset[]
  mediaError: string | null
  letterId: string
}) {
  const initialEditorState = createEditorState(draft)
  const [editorState, setEditorState] = useState(initialEditorState)
  const [saveState, setSaveState] = useState<SaveState>('saved')
  const savedSnapshotRef = useRef(serializeEditorState(initialEditorState))
  const editorStateRef = useRef(initialEditorState)
  const updateDraftMutation = useUpdateCreatorLetterDraft(letterId)
  const uploadMediaMutation = useUploadCreatorLetterMedia(letterId)
  const deleteMediaMutation = useDeleteCreatorLetterMedia(letterId)
  const reorderMediaMutation = useReorderCreatorLetterMedia(letterId)
  const updateDraft = updateDraftMutation.mutateAsync

  const serializedState = serializeEditorState(editorState)

  const saveDraft = useCallback(
    async (state: EditorState, snapshot: string) => {
      setSaveState('saving')

      try {
        await updateDraft({
          title: state.title,
          content: state.content,
        })
        savedSnapshotRef.current = snapshot
        setSaveState('saved')
      } catch (error: unknown) {
        setSaveState('error')
        throw error
      }
    },
    [updateDraft],
  )

  const saveDraftIfNeeded = useCallback(async () => {
    const currentState = editorStateRef.current
    const snapshot = serializeEditorState(currentState)

    if (snapshot === savedSnapshotRef.current) {
      return
    }

    await saveDraft(currentState, snapshot)
  }, [saveDraft])

  useEffect(() => {
    if (serializedState === savedSnapshotRef.current) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      void saveDraft(editorState, serializedState).catch(() => undefined)
    }, 700)

    return () => window.clearTimeout(timeoutId)
  }, [editorState, saveDraft, serializedState])

  function updateTitle(title: string) {
    const nextState = { ...editorStateRef.current, title }
    editorStateRef.current = nextState
    setEditorState(nextState)
  }

  function updateField(fieldId: string, value: string) {
    const nextState = {
      ...editorStateRef.current,
      content: { ...editorStateRef.current.content, [fieldId]: value },
    }
    editorStateRef.current = nextState
    setEditorState(nextState)
  }

  async function handleMediaUpload(
    fieldId: string,
    file: File,
    durationSeconds?: number,
  ) {
    await saveDraftIfNeeded()
    const asset = await uploadMediaMutation.mutateAsync({
      fieldId,
      file,
      durationSeconds,
    })
    const currentState = editorStateRef.current
    const nextState = {
      ...currentState,
      content: updateMediaContent(draft, currentState.content, asset),
    }

    savedSnapshotRef.current = serializeEditorState(nextState)
    editorStateRef.current = nextState
    setEditorState(nextState)
    setSaveState('saved')
  }

  async function handleMediaDelete(assetId: string) {
    await saveDraftIfNeeded()
    const asset = mediaAssets.find((candidate) => candidate.id === assetId)

    if (!asset) {
      return
    }

    await deleteMediaMutation.mutateAsync(assetId)
    const currentState = editorStateRef.current
    const nextState = {
      ...currentState,
      content: removeMediaContent(currentState.content, asset),
    }

    savedSnapshotRef.current = serializeEditorState(nextState)
    editorStateRef.current = nextState
    setEditorState(nextState)
    setSaveState('saved')
  }

  async function handleMediaReorder(fieldId: string, assetIds: string[]) {
    await saveDraftIfNeeded()
    await reorderMediaMutation.mutateAsync({ fieldId, assetIds })
    const currentState = editorStateRef.current
    const nextState = {
      ...currentState,
      content: setMediaOrder(currentState.content, fieldId, assetIds),
    }

    savedSnapshotRef.current = serializeEditorState(nextState)
    editorStateRef.current = nextState
    setEditorState(nextState)
    setSaveState('saved')
  }

  const mediaBusy =
    uploadMediaMutation.isPending ||
    deleteMediaMutation.isPending ||
    reorderMediaMutation.isPending
  const saveLabel =
    saveState === 'saving'
      ? 'Saving…'
      : saveState === 'error'
        ? 'Unable to save'
        : 'Saved'

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <Link
            className="text-sm font-semibold text-[var(--dearly-plum)] underline underline-offset-4"
            href="/creator"
          >
            ← Back to Drafts
          </Link>
          <Link
            className="rounded-full bg-[var(--dearly-ink)] px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[var(--dearly-plum)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--dearly-plum)]"
            href={`/creator/letters/${letterId}/preview`}
          >
            Preview Letter
          </Link>
        </div>
        <p className="text-sm text-[var(--dearly-muted)]" role="status">
          {saveLabel}
        </p>
      </div>

      <header>
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--dearly-plum)]">
          {draft.template.category.name}
        </p>
        <h1 className="mt-3 text-4xl leading-tight">Edit your Letter Draft</h1>
        <p className="mt-3 leading-7 text-[var(--dearly-muted)]">
          {draft.template.name} is saved as a Template snapshot. Your Draft is
          private until you publish it.
        </p>
      </header>

      <section className="space-y-6" aria-labelledby="draft-details-heading">
        <h2 id="draft-details-heading" className="text-2xl">
          Draft details
        </h2>
        <label className="block text-sm">
          <span className="mb-2 block font-semibold">Letter title</span>
          <input
            aria-describedby="title-description"
            className="w-full rounded-xl border border-[var(--dearly-blush)] bg-white px-4 py-3 outline-none transition focus:border-[var(--dearly-plum)]"
            maxLength={120}
            value={editorState.title}
            onChange={(event) => updateTitle(event.target.value)}
          />
          <span
            id="title-description"
            className="mt-2 block text-sm text-[var(--dearly-muted)]"
          >
            This private title helps you find the Draft in your dashboard.
          </span>
        </label>
      </section>

      <section className="space-y-6" aria-labelledby="letter-fields-heading">
        <div>
          <h2 id="letter-fields-heading" className="text-2xl">
            Personalize your Letter
          </h2>
          <p className="mt-2 leading-7 text-[var(--dearly-muted)]">
            Fill the text and media Fields now. Required Fields will be checked
            before publishing.
          </p>
        </div>

        {mediaError ? (
          <p
            className="rounded-xl bg-red-50 p-4 text-sm leading-6 text-red-800"
            role="alert"
          >
            {mediaError}
          </p>
        ) : null}

        <div className="space-y-5">
          {draft.template.definition.fields.map((field) => {
            if (!isEditableField(field)) {
              if (
                field.type === 'photo' ||
                field.type === 'photo-gallery' ||
                field.type === 'audio'
              ) {
                return (
                  <MediaFieldEditor
                    key={field.id}
                    field={field}
                    assets={mediaAssets}
                    busy={mediaBusy}
                    onUpload={handleMediaUpload}
                    onDelete={handleMediaDelete}
                    onReorder={handleMediaReorder}
                  />
                )
              }

              return null
            }

            const descriptionId = `${field.id}-description`
            const isRichText = field.type === 'rich-text'
            const maxLength =
              'maxLength' in field
                ? field.maxLength
                : field.type === 'recipient-name'
                  ? 120
                  : undefined

            return (
              <label key={field.id} className="block text-sm">
                <span className="mb-2 block font-semibold">
                  {field.label}{' '}
                  <span className="font-normal text-[var(--dearly-muted)]">
                    ({field.required ? 'required for publishing' : 'optional'})
                  </span>
                </span>
                {isRichText ? (
                  <textarea
                    aria-describedby={descriptionId}
                    className="min-h-40 w-full rounded-xl border border-[var(--dearly-blush)] bg-white px-4 py-3 leading-7 outline-none transition focus:border-[var(--dearly-plum)]"
                    maxLength={maxLength}
                    value={getTextValue(editorState.content, field.id)}
                    onChange={(event) =>
                      updateField(field.id, event.target.value)
                    }
                  />
                ) : (
                  <input
                    aria-describedby={descriptionId}
                    className="w-full rounded-xl border border-[var(--dearly-blush)] bg-white px-4 py-3 outline-none transition focus:border-[var(--dearly-plum)]"
                    maxLength={maxLength}
                    value={getTextValue(editorState.content, field.id)}
                    onChange={(event) =>
                      updateField(field.id, event.target.value)
                    }
                  />
                )}
                <span
                  id={descriptionId}
                  className="mt-2 block text-sm leading-6 text-[var(--dearly-muted)]"
                >
                  {field.description ??
                    (isRichText
                      ? 'Paragraphs and line breaks are supported.'
                      : 'You can change this value before publishing.')}
                </span>
              </label>
            )
          })}
        </div>
      </section>

      {saveState === 'error' ? (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-red-50 p-4 text-sm leading-6 text-red-800">
          <p>We could not save your latest changes.</p>
          <Button
            onClick={() =>
              void saveDraft(editorStateRef.current, serializedState).catch(
                () => undefined,
              )
            }
            type="button"
            variant="ghost"
          >
            Try saving again
          </Button>
        </div>
      ) : null}

      <PublishLetterPanel
        beforePublish={saveDraftIfNeeded}
        letterId={letterId}
      />
    </div>
  )
}
