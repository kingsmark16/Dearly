'use client'

import type { CreatorLetterDraft } from '@dearly/contracts'
import axios from 'axios'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@dearly/ui/button'
import { useCreatorLetter } from '../hooks/use-creator-letter'
import { useUpdateCreatorLetterDraft } from '../hooks/use-update-creator-letter-draft'

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

export function DraftEditor({ letterId }: { letterId: string }) {
  const router = useRouter()
  const draftQuery = useCreatorLetter(letterId)

  useEffect(() => {
    if (
      axios.isAxiosError(draftQuery.error) &&
      draftQuery.error.response?.status === 401
    ) {
      router.replace('/sign-in')
    }
  }, [draftQuery.error, router])

  if (
    axios.isAxiosError(draftQuery.error) &&
    draftQuery.error.response?.status === 401
  ) {
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
      letterId={letterId}
    />
  )
}

function DraftEditorForm({
  draft,
  letterId,
}: {
  draft: CreatorLetterDraft
  letterId: string
}) {
  const initialEditorState = createEditorState(draft)
  const [editorState, setEditorState] = useState(initialEditorState)
  const [saveState, setSaveState] = useState<SaveState>('saved')
  const savedSnapshotRef = useRef(serializeEditorState(initialEditorState))
  const updateDraftMutation = useUpdateCreatorLetterDraft(letterId)
  const updateDraft = updateDraftMutation.mutate

  const serializedState = serializeEditorState(editorState)

  const saveDraft = useCallback(
    (state: EditorState, snapshot: string) => {
      setSaveState('saving')
      updateDraft(
        {
          title: state.title,
          content: state.content,
        },
        {
          onSuccess: () => {
            savedSnapshotRef.current = snapshot
            setSaveState('saved')
          },
          onError: () => {
            setSaveState('error')
          },
        },
      )
    },
    [updateDraft],
  )

  useEffect(() => {
    if (serializedState === savedSnapshotRef.current) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      saveDraft(editorState, serializedState)
    }, 700)

    return () => window.clearTimeout(timeoutId)
  }, [editorState, saveDraft, serializedState])

  function updateTitle(title: string) {
    setEditorState((current) => ({ ...current, title }))
  }

  function updateField(fieldId: string, value: string) {
    setEditorState((current) => ({
      ...current,
      content: { ...current.content, [fieldId]: value },
    }))
  }

  const saveLabel =
    saveState === 'saving'
      ? 'Saving…'
      : saveState === 'error'
        ? 'Unable to save'
        : 'Saved'

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          className="text-sm font-semibold text-[var(--dearly-plum)] underline underline-offset-4"
          href="/creator"
        >
          ← Back to Drafts
        </Link>
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
            Fill the text Fields now. Required Fields will be checked before
            publishing.
          </p>
        </div>

        <div className="space-y-5">
          {draft.template.definition.fields.map((field) => {
            if (!isEditableField(field)) {
              return (
                <div
                  key={field.id}
                  className="rounded-2xl border border-dashed border-[var(--dearly-blush)] p-5"
                  role="note"
                >
                  <p className="font-semibold">{field.label}</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--dearly-muted)]">
                    This media Field will be available in the next editor step.
                  </p>
                </div>
              )
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
            onClick={() => saveDraft(editorState, serializedState)}
            type="button"
            variant="ghost"
          >
            Try saving again
          </Button>
        </div>
      ) : null}
    </div>
  )
}
