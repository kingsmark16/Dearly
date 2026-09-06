import { Inject, Injectable } from '@nestjs/common'
import { LetterStatus, Prisma } from '../../../generated/prisma/client.js'
import { PrismaService } from '../../../infrastructure/database/prisma.service.js'
import type {
  CreateLetterDraftRecord,
  LetterDraftRecord,
  UpdateLetterDraftRecord,
} from '../domain/letter.js'
import type { LetterRepository } from '../application/ports/letter-repository.js'

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

@Injectable()
export class PrismaLetterRepository implements LetterRepository {
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
}
