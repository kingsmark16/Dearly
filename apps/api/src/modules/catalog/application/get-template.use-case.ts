import { Inject, Injectable } from '@nestjs/common'
import {
  CatalogTemplateNotFoundError,
  type CatalogTemplate,
} from '../domain/template.js'
import {
  CATALOG_REPOSITORY,
  type CatalogRepository,
} from './ports/catalog-repository.js'

@Injectable()
export class GetTemplateUseCase {
  constructor(
    @Inject(CATALOG_REPOSITORY)
    private readonly catalogRepository: CatalogRepository,
  ) {}

  async execute(slug: string): Promise<CatalogTemplate> {
    const template = await this.catalogRepository.findTemplateBySlug(slug)

    if (!template) {
      throw new CatalogTemplateNotFoundError(slug)
    }

    return template
  }
}
