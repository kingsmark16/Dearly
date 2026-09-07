import { Inject, Injectable } from '@nestjs/common'
import {
  LetterRestoreStatus as PrismaLetterRestoreStatus,
  LetterStatus,
  Prisma,
} from '../../../generated/prisma/client.js'
import { PrismaService } from '../../../infrastructure/database/prisma.service.js'
import type {
  CreateLetterDraftRecord,
  CreatorLetterLifecycleRecord,
  CreatorLetterRecord,
  LetterArchivedRecord,
  LetterDraftRecord,
  LetterPublishedRecord,
  LetterTrashCandidate,
  LetterTrashedRecord,
  PermanentlyDeletedLetter,
  UpdateLetterRecord,
  UpdateLetterDraftRecord,
} from '../domain/letter.js'
import { LetterLifecycleTransitionError } from '../domain/letter.js'
import type {
  CreatorLetterReader,
  LetterEditorRepository,
  LetterPublishingRepository,
  LetterLifecycleRepository,
  LetterRepository,
  PublishedLetterReader,
} from '../application/ports/letter-repository.js'

function asJsonObject(
  value: Prisma.JsonValue,
  fieldName: string,
): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`Letter ${fieldName} must be a JSON object`)
  }

  return value as Record<string, unknown>
}

function toDraftRecord(letter: {
  id: string
  creatorId: string
  title: string
  status: LetterStatus
  templateSnapshot: Prisma.JsonValue
  content: Prisma.JsonValue
  createdAt: Date
  updatedAt: Date
}): LetterDraftRecord {
  if (letter.status !== LetterStatus.DRAFT) {
    throw new Error(`Expected a draft Letter: ${letter.id}`)
  }

  return {
    id: letter.id,
    creatorId: letter.creatorId,
    title: letter.title,
    status: 'draft',
    template: asJsonObject(
      letter.templateSnapshot,
      'templateSnapshot',
    ) as unknown as LetterDraftRecord['template'],
    content: asJsonObject(letter.content, 'content'),
    createdAt: letter.createdAt,
    updatedAt: letter.updatedAt,
  }
}

function toPublishedRecord(letter: {
  id: string
  creatorId: string
  title: string
  status: LetterStatus
  shareToken: string | null
  templateSnapshot: Prisma.JsonValue
  content: Prisma.JsonValue
  publishedContent: Prisma.JsonValue | null
  createdAt: Date
  updatedAt: Date
}): LetterPublishedRecord {
  if (letter.status !== LetterStatus.PUBLISHED || !letter.shareToken) {
    throw new Error(
      `Expected a published Letter with a Share token: ${letter.id}`,
    )
  }

  const workingContent = asJsonObject(letter.content, 'content')
  const publishedContent = asJsonObject(
    letter.publishedContent ?? letter.content,
    'publishedContent',
  )

  return {
    id: letter.id,
    creatorId: letter.creatorId,
    title: letter.title,
    status: 'published',
    shareToken: letter.shareToken,
    template: asJsonObject(
      letter.templateSnapshot,
      'templateSnapshot',
    ) as unknown as LetterPublishedRecord['template'],
    content: publishedContent,
    pendingContent:
      JSON.stringify(workingContent) === JSON.stringify(publishedContent)
        ? null
        : workingContent,
    createdAt: letter.createdAt,
    updatedAt: letter.updatedAt,
  }
}

function toCreatorRecord(letter: {
  id: string
  creatorId: string
  title: string
  status: LetterStatus
  shareToken: string | null
  templateSnapshot: Prisma.JsonValue
  content: Prisma.JsonValue
  publishedContent: Prisma.JsonValue | null
  createdAt: Date
  updatedAt: Date
}): CreatorLetterRecord {
  if (letter.status === LetterStatus.DRAFT) {
    return toDraftRecord(letter)
  }

  if (letter.status === LetterStatus.PUBLISHED) {
    return toPublishedRecord(letter)
  }

  throw new Error(`Expected an editable Letter: ${letter.id}`)
}

function toDomainRestoreStatus(status: PrismaLetterRestoreStatus) {
  switch (status) {
    case PrismaLetterRestoreStatus.DRAFT:
      return 'draft' as const
    case PrismaLetterRestoreStatus.PUBLISHED:
      return 'published' as const
    case PrismaLetterRestoreStatus.ARCHIVED:
      return 'archived' as const
  }
}

function toDomainActiveRestoreStatus(status: PrismaLetterRestoreStatus) {
  switch (status) {
    case PrismaLetterRestoreStatus.DRAFT:
      return 'draft' as const
    case PrismaLetterRestoreStatus.PUBLISHED:
      return 'published' as const
    default:
      throw new Error(`Expected an active restore status: ${status}`)
  }
}

function toPrismaRestoreStatus(status: LetterStatus) {
  switch (status) {
    case LetterStatus.DRAFT:
      return PrismaLetterRestoreStatus.DRAFT
    case LetterStatus.PUBLISHED:
      return PrismaLetterRestoreStatus.PUBLISHED
    case LetterStatus.ARCHIVED:
      return PrismaLetterRestoreStatus.ARCHIVED
    default:
      throw new Error(`Letter status cannot be restored: ${status}`)
  }
}

function toPrismaLetterStatus(status: PrismaLetterRestoreStatus) {
  switch (status) {
    case PrismaLetterRestoreStatus.DRAFT:
      return LetterStatus.DRAFT
    case PrismaLetterRestoreStatus.PUBLISHED:
      return LetterStatus.PUBLISHED
    case PrismaLetterRestoreStatus.ARCHIVED:
      return LetterStatus.ARCHIVED
  }
}

function toArchivedRecord(letter: {
  id: string
  creatorId: string
  title: string
  status: LetterStatus
  shareToken: string | null
  templateSnapshot: Prisma.JsonValue
  archivedFromStatus: PrismaLetterRestoreStatus | null
  archivedAt: Date | null
  createdAt: Date
  updatedAt: Date
}): LetterArchivedRecord {
  if (
    letter.status !== LetterStatus.ARCHIVED ||
    !letter.archivedFromStatus ||
    letter.archivedFromStatus === PrismaLetterRestoreStatus.ARCHIVED ||
    !letter.archivedAt
  ) {
    throw new Error(
      `Expected an archived Letter with restore metadata: ${letter.id}`,
    )
  }

  return {
    id: letter.id,
    creatorId: letter.creatorId,
    title: letter.title,
    status: 'archived',
    template: asJsonObject(
      letter.templateSnapshot,
      'templateSnapshot',
    ) as unknown as LetterArchivedRecord['template'],
    restoreStatus: toDomainActiveRestoreStatus(letter.archivedFromStatus),
    shareToken: letter.shareToken,
    archivedAt: letter.archivedAt,
    createdAt: letter.createdAt,
    updatedAt: letter.updatedAt,
  }
}

function toTrashedRecord(letter: {
  id: string
  creatorId: string
  title: string
  status: LetterStatus
  shareToken: string | null
  templateSnapshot: Prisma.JsonValue
  trashedFromStatus: PrismaLetterRestoreStatus | null
  trashedAt: Date | null
  createdAt: Date
  updatedAt: Date
}): LetterTrashedRecord {
  if (
    letter.status !== LetterStatus.TRASHED ||
    !letter.trashedFromStatus ||
    !letter.trashedAt
  ) {
    throw new Error(
      `Expected a trashed Letter with restore metadata: ${letter.id}`,
    )
  }

  return {
    id: letter.id,
    creatorId: letter.creatorId,
    title: letter.title,
    status: 'trashed',
    template: asJsonObject(
      letter.templateSnapshot,
      'templateSnapshot',
    ) as unknown as LetterTrashedRecord['template'],
    restoreStatus: toDomainRestoreStatus(letter.trashedFromStatus),
    shareToken: letter.shareToken,
    trashedAt: letter.trashedAt,
    createdAt: letter.createdAt,
    updatedAt: letter.updatedAt,
  }
}

function toLifecycleRecord(letter: {
  id: string
  creatorId: string
  title: string
  status: LetterStatus
  shareToken: string | null
  templateSnapshot: Prisma.JsonValue
  content: Prisma.JsonValue
  publishedContent: Prisma.JsonValue | null
  archivedFromStatus: PrismaLetterRestoreStatus | null
  trashedFromStatus: PrismaLetterRestoreStatus | null
  archivedAt: Date | null
  trashedAt: Date | null
  createdAt: Date
  updatedAt: Date
}): CreatorLetterLifecycleRecord {
  if (letter.status === LetterStatus.DRAFT) {
    return toDraftRecord(letter)
  }

  if (letter.status === LetterStatus.PUBLISHED) {
    return toPublishedRecord(letter)
  }

  if (letter.status === LetterStatus.ARCHIVED) {
    return toArchivedRecord(letter)
  }

  return toTrashedRecord(letter)
}

@Injectable()
export class PrismaLetterRepository
  implements
    LetterRepository,
    CreatorLetterReader,
    LetterEditorRepository,
    LetterLifecycleRepository,
    LetterPublishingRepository,
    PublishedLetterReader
{
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async createDraft(
    input: CreateLetterDraftRecord,
  ): Promise<LetterDraftRecord> {
    const letter = await this.prisma.letter.create({
      data: {
        creatorId: input.creatorId,
        title: input.title,
        status: LetterStatus.DRAFT,
        templateSlug: input.template.slug,
        templateVersion: input.template.version,
        templateSnapshot: input.template as unknown as Prisma.InputJsonValue,
        content: {} as Prisma.InputJsonObject,
      },
    })

    return toDraftRecord(letter)
  }

  async listByCreator(
    creatorId: string,
  ): Promise<CreatorLetterLifecycleRecord[]> {
    const letters = await this.prisma.letter.findMany({
      where: {
        creatorId,
      },
      orderBy: { updatedAt: 'desc' },
    })

    return letters.map(toLifecycleRecord)
  }

  async findByIdForCreator(
    creatorId: string,
    letterId: string,
  ): Promise<CreatorLetterRecord | undefined> {
    const letter = await this.prisma.letter.findFirst({
      where: {
        id: letterId,
        creatorId,
        status: { in: [LetterStatus.DRAFT, LetterStatus.PUBLISHED] },
      },
    })

    return letter ? toCreatorRecord(letter) : undefined
  }

  async findDraftById(
    creatorId: string,
    letterId: string,
  ): Promise<LetterDraftRecord | undefined> {
    const letter = await this.prisma.letter.findFirst({
      where: {
        id: letterId,
        creatorId,
        status: LetterStatus.DRAFT,
      },
    })

    return letter ? toDraftRecord(letter) : undefined
  }

  async updateDraft(
    input: UpdateLetterDraftRecord,
  ): Promise<LetterDraftRecord | undefined> {
    return this.prisma.$transaction(async (transaction) => {
      const result = await transaction.letter.updateMany({
        where: {
          id: input.letterId,
          creatorId: input.creatorId,
          status: LetterStatus.DRAFT,
        },
        data: {
          title: input.title,
          content: input.content as Prisma.InputJsonObject,
        },
      })

      if (result.count === 0) {
        return undefined
      }

      const letter = await transaction.letter.findFirst({
        where: {
          id: input.letterId,
          creatorId: input.creatorId,
          status: LetterStatus.DRAFT,
        },
      })

      return letter ? toDraftRecord(letter) : undefined
    })
  }

  async updateLetter(
    input: UpdateLetterRecord,
  ): Promise<CreatorLetterRecord | undefined> {
    return this.prisma.$transaction(async (transaction) => {
      const result = await transaction.letter.updateMany({
        where: {
          id: input.letterId,
          creatorId: input.creatorId,
          status: { in: [LetterStatus.DRAFT, LetterStatus.PUBLISHED] },
        },
        data: {
          title: input.title,
          content: input.content as Prisma.InputJsonObject,
        },
      })

      if (result.count === 0) {
        return undefined
      }

      const letter = await transaction.letter.findFirst({
        where: {
          id: input.letterId,
          creatorId: input.creatorId,
          status: { in: [LetterStatus.DRAFT, LetterStatus.PUBLISHED] },
        },
      })

      return letter ? toCreatorRecord(letter) : undefined
    })
  }

  async changeLifecycle(input: {
    creatorId: string
    letterId: string
    action: 'archive' | 'restore' | 'trash'
  }): Promise<CreatorLetterLifecycleRecord | undefined> {
    return this.prisma.$transaction(async (transaction) => {
      const current = await transaction.letter.findFirst({
        where: {
          id: input.letterId,
          creatorId: input.creatorId,
        },
      })

      if (!current) {
        return undefined
      }

      const now = new Date()
      let data: Prisma.LetterUpdateManyMutationInput

      if (input.action === 'archive') {
        if (
          current.status !== LetterStatus.DRAFT &&
          current.status !== LetterStatus.PUBLISHED
        ) {
          throw new LetterLifecycleTransitionError(
            `Only an active Letter can be archived: ${input.letterId}`,
          )
        }

        data = {
          status: LetterStatus.ARCHIVED,
          archivedFromStatus: toPrismaRestoreStatus(current.status),
          archivedAt: now,
          trashedFromStatus: null,
          trashedAt: null,
        }
      } else if (input.action === 'trash') {
        if (current.status === LetterStatus.TRASHED) {
          throw new LetterLifecycleTransitionError(
            `The Letter is already in Trash: ${input.letterId}`,
          )
        }

        if (
          current.status !== LetterStatus.DRAFT &&
          current.status !== LetterStatus.PUBLISHED &&
          current.status !== LetterStatus.ARCHIVED
        ) {
          throw new LetterLifecycleTransitionError(
            `This Letter cannot be moved to Trash: ${input.letterId}`,
          )
        }

        data = {
          status: LetterStatus.TRASHED,
          trashedFromStatus: toPrismaRestoreStatus(current.status),
          trashedAt: now,
        }

        if (current.status !== LetterStatus.ARCHIVED) {
          data.archivedFromStatus = null
          data.archivedAt = null
        }
      } else {
        if (current.status === LetterStatus.ARCHIVED) {
          if (
            !current.archivedFromStatus ||
            current.archivedFromStatus === PrismaLetterRestoreStatus.ARCHIVED
          ) {
            throw new LetterLifecycleTransitionError(
              `The Archived Letter is missing its restore state: ${input.letterId}`,
            )
          }

          data = {
            status: toPrismaLetterStatus(current.archivedFromStatus),
            archivedFromStatus: null,
            archivedAt: null,
          }
        } else if (current.status === LetterStatus.TRASHED) {
          if (!current.trashedFromStatus) {
            throw new LetterLifecycleTransitionError(
              `The Trashed Letter is missing its restore state: ${input.letterId}`,
            )
          }

          data = {
            status: toPrismaLetterStatus(current.trashedFromStatus),
            trashedFromStatus: null,
            trashedAt: null,
          }
        } else {
          throw new LetterLifecycleTransitionError(
            `Only an Archived Letter or Trashed Letter can be restored: ${input.letterId}`,
          )
        }
      }

      const updated = await transaction.letter.updateMany({
        where: {
          id: input.letterId,
          creatorId: input.creatorId,
          status: current.status,
        },
        data,
      })

      if (updated.count === 0) {
        return undefined
      }

      const letter = await transaction.letter.findFirst({
        where: {
          id: input.letterId,
          creatorId: input.creatorId,
        },
      })

      return letter ? toLifecycleRecord(letter) : undefined
    })
  }

  async permanentlyDelete(input: {
    creatorId: string
    letterId: string
  }): Promise<PermanentlyDeletedLetter | undefined> {
    return this.prisma.$transaction(async (transaction) => {
      const letter = await transaction.letter.findFirst({
        where: {
          id: input.letterId,
          creatorId: input.creatorId,
          status: LetterStatus.TRASHED,
        },
        select: {
          id: true,
          mediaAssets: { select: { objectKey: true } },
        },
      })

      if (!letter) {
        return undefined
      }

      await transaction.letter.delete({ where: { id: letter.id } })

      return {
        letterId: letter.id,
        mediaObjectKeys: letter.mediaAssets.map((asset) => asset.objectKey),
      }
    })
  }

  async listExpiredTrash(before: Date): Promise<LetterTrashCandidate[]> {
    const letters = await this.prisma.letter.findMany({
      where: {
        status: LetterStatus.TRASHED,
        trashedAt: { lte: before },
      },
      select: { id: true, creatorId: true },
      orderBy: { trashedAt: 'asc' },
    })

    return letters.map((letter) => ({
      letterId: letter.id,
      creatorId: letter.creatorId,
    }))
  }

  async publishDraft(input: {
    creatorId: string
    letterId: string
    shareToken: string
  }): Promise<LetterPublishedRecord | undefined> {
    return this.prisma.$transaction(async (transaction) => {
      const alreadyPublished = await transaction.letter.findFirst({
        where: {
          id: input.letterId,
          creatorId: input.creatorId,
          status: LetterStatus.PUBLISHED,
        },
      })

      if (alreadyPublished) {
        return toPublishedRecord(alreadyPublished)
      }

      const draft = await transaction.letter.findFirst({
        where: {
          id: input.letterId,
          creatorId: input.creatorId,
          status: LetterStatus.DRAFT,
        },
      })

      if (!draft) {
        return undefined
      }

      const result = await transaction.letter.updateMany({
        where: {
          id: input.letterId,
          creatorId: input.creatorId,
          status: LetterStatus.DRAFT,
        },
        data: {
          status: LetterStatus.PUBLISHED,
          shareToken: input.shareToken,
          publishedContent: draft.content as Prisma.InputJsonValue,
        },
      })

      if (result.count === 0) {
        const publishedAfterRace = await transaction.letter.findFirst({
          where: {
            id: input.letterId,
            creatorId: input.creatorId,
            status: LetterStatus.PUBLISHED,
          },
        })

        return publishedAfterRace
          ? toPublishedRecord(publishedAfterRace)
          : undefined
      }

      const published = await transaction.letter.findFirst({
        where: {
          id: input.letterId,
          creatorId: input.creatorId,
          status: LetterStatus.PUBLISHED,
        },
      })

      return published ? toPublishedRecord(published) : undefined
    })
  }

  async publishRevision(input: {
    creatorId: string
    letterId: string
  }): Promise<LetterPublishedRecord | undefined> {
    return this.prisma.$transaction(async (transaction) => {
      const current = await transaction.letter.findFirst({
        where: {
          id: input.letterId,
          creatorId: input.creatorId,
          status: LetterStatus.PUBLISHED,
        },
      })

      if (!current) {
        return undefined
      }

      await transaction.letter.update({
        where: { id: current.id },
        data: { publishedContent: current.content as Prisma.InputJsonValue },
      })

      const published = await transaction.letter.findFirst({
        where: {
          id: input.letterId,
          creatorId: input.creatorId,
          status: LetterStatus.PUBLISHED,
        },
      })

      return published ? toPublishedRecord(published) : undefined
    })
  }

  async findPublishedByShareToken(
    shareToken: string,
  ): Promise<LetterPublishedRecord | undefined> {
    const letter = await this.prisma.letter.findFirst({
      where: {
        shareToken,
        status: LetterStatus.PUBLISHED,
      },
    })

    return letter ? toPublishedRecord(letter) : undefined
  }
}
