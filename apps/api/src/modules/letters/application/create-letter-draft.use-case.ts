import { Inject, Injectable } from '@nestjs/common'
import {
  CATALOG_REPOSITORY,
  type CatalogRepository,
} from '../../catalog/application/ports/catalog-repository.js'
import { CatalogTemplateNotFoundError } from '../../catalog/domain/template.js'
import {
  LETTER_REPOSITORY,
  type LetterRepository,
} from './ports/letter-repository.js'
import type { LetterDraftRecord } from '../domain/letter.js'

export type CreateLetterDraftCommand = {
  creatorId: string
  templateSlug: string
  title?: string
}

@Injectable()
export class CreateLetterDraftUseCase {
  constructor(
    @Inject(CATALOG_REPOSITORY)
    private readonly catalogRepository: CatalogRepository,
    @Inject(LETTER_REPOSITORY)
    private readonly letterRepository: LetterRepository,
  ) {}

  async execute(command: CreateLetterDraftCommand): Promise<LetterDraftRecord> {
    const template = await this.catalogRepository.findTemplateBySlug(
      command.templateSlug,
    )

    if (!template) {
      throw new CatalogTemplateNotFoundError(command.templateSlug)
    }

    return this.letterRepository.createDraft({
      creatorId: command.creatorId,
      title: command.title?.trim() || template.name,
      template,
    })
  }
}
