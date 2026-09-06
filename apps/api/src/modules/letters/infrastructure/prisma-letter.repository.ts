import { Inject, Injectable } from '@nestjs/common'
import { LetterStatus, Prisma } from '../../../generated/prisma/client.js'
import { PrismaService } from '../../../infrastructure/database/prisma.service.js'
import type {
  CreateLetterDraftRecord,
  LetterDraftRecord,
  LetterPublishedRecord,
  UpdateLetterDraftRecord,
} from '../domain/letter.js'
import type {
  LetterPublishingRepository,
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
  createdAt: Date
  updatedAt: Date
}): LetterPublishedRecord {
  if (letter.status !== LetterStatus.PUBLISHED || !letter.shareToken) {
    throw new Error(
      `Expected a published Letter with a Share token: ${letter.id}`,
    )
  }

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
    content: asJsonObject(letter.content, 'content'),
    createdAt: letter.createdAt,
    updatedAt: letter.updatedAt,
  }
}

@Injectable()
export class PrismaLetterRepository
  implements LetterRepository, LetterPublishingRepository, PublishedLetterReader
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

  async listByCreator(creatorId: string): Promise<LetterDraftRecord[]> {
    const letters = await this.prisma.letter.findMany({
      where: { creatorId, status: LetterStatus.DRAFT },
      orderBy: { updatedAt: 'desc' },
    })

    return letters.map(toDraftRecord)
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

      const result = await transaction.letter.updateMany({
        where: {
          id: input.letterId,
          creatorId: input.creatorId,
          status: LetterStatus.DRAFT,
        },
        data: {
          status: LetterStatus.PUBLISHED,
          shareToken: input.shareToken,
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
