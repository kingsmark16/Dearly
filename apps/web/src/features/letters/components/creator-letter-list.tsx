'use client'

import type { CreatorLetterSummary } from '@dearly/contracts/letters/creator-letter'
import Link from 'next/link'
import { LetterLifecycleActions } from './letter-lifecycle-actions'

type LetterSectionDefinition = {
  status: CreatorLetterSummary['status']
  title: string
  emptyMessage: string
}

const sectionDefinitions: LetterSectionDefinition[] = [
  {
    status: 'draft',
    title: 'Drafts',
    emptyMessage: 'You do not have any Drafts yet.',
  },
  {
    status: 'published',
    title: 'Published Letters',
    emptyMessage: 'You do not have any Published Letters yet.',
  },
  {
    status: 'archived',
    title: 'Archived Letters',
    emptyMessage: 'You do not have any Archived Letters.',
  },
  {
    status: 'trashed',
    title: 'Trash',
    emptyMessage: 'Trash is empty.',
  },
]

function getLetterStatusMessage(letter: CreatorLetterSummary) {
  if (letter.status === 'published') {
    return letter.hasPendingRevision
      ? 'Pending revision not yet public'
      : 'Published'
  }

  if (letter.status === 'archived') {
    return `Archived · restores to ${letter.restoreStatus ?? 'its previous state'}`
  }

  if (letter.status === 'trashed') {
    return `In Trash · restores to ${letter.restoreStatus ?? 'its previous state'}`
  }

  return 'Draft'
}

function CreatorLetterListItem({ letter }: { letter: CreatorLetterSummary }) {
  const canEdit = letter.status === 'draft' || letter.status === 'published'

  return (
    <li
      className="rounded-2xl border border-[var(--dearly-blush)] bg-white/70 p-4"
      data-letter-id={letter.id}
    >
      {canEdit ? (
        <Link
          className="block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--dearly-plum)]"
          href={`/creator/letters/${letter.id}`}
        >
          <p className="font-semibold">{letter.title}</p>
          <p className="mt-1 text-sm font-semibold text-[var(--dearly-plum)]">
            {letter.status === 'published'
              ? 'Edit Published Letter'
              : 'Edit Draft'}
          </p>
        </Link>
      ) : (
        <div>
          <p className="font-semibold">{letter.title}</p>
          <p className="mt-1 text-sm font-semibold text-[var(--dearly-plum)]">
            {letter.status === 'archived'
              ? 'Archived Letter'
              : 'Trashed Letter'}
          </p>
        </div>
      )}

      <p className="mt-1 text-sm text-[var(--dearly-muted)]">
        {letter.template.category.name} · {letter.template.name}
      </p>
      <p className="mt-2 text-sm text-[var(--dearly-muted)]">
        {getLetterStatusMessage(letter)}
      </p>
      <LetterLifecycleActions letterId={letter.id} status={letter.status} />
    </li>
  )
}

export function CreatorLetterList({
  letters,
}: {
  letters: CreatorLetterSummary[]
}) {
  if (letters.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-[var(--dearly-blush)] p-5 text-[var(--dearly-muted)]">
        You do not have any Letters yet.
      </p>
    )
  }

  return (
    <div aria-label="Your saved letters" className="space-y-6" role="list">
      {sectionDefinitions.map((section) => {
        const sectionLetters = letters.filter(
          (letter) => letter.status === section.status,
        )
        const headingId = `creator-${section.status}-heading`

        return (
          <section
            aria-labelledby={headingId}
            className="space-y-3"
            key={section.status}
          >
            <h3 id={headingId} className="text-xl">
              {section.title}
            </h3>
            {sectionLetters.length > 0 ? (
              <ul className="space-y-3">
                {sectionLetters.map((letter) => (
                  <CreatorLetterListItem key={letter.id} letter={letter} />
                ))}
              </ul>
            ) : (
              <p className="text-sm text-[var(--dearly-muted)]">
                {section.emptyMessage}
              </p>
            )}
          </section>
        )
      })}
    </div>
  )
}
