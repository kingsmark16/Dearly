import { Inject, Injectable } from '@nestjs/common'
import type { TemplateSummary } from '@dearly/contracts/catalog/template'
import {
  CATALOG_REPOSITORY,
  type CatalogRepository,
} from './ports/catalog-repository.js'

@Injectable()
export class ListTemplatesUseCase {
  constructor(
    @Inject(CATALOG_REPOSITORY)
    private readonly catalogRepository: CatalogRepository,
  ) {}

  async execute(categorySlug?: string): Promise<TemplateSummary[]> {
    return this.catalogRepository.listTemplates(categorySlug)
  }
}
