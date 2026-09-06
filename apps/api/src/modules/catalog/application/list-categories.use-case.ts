import { Inject, Injectable } from '@nestjs/common'
import type { Category } from '@dearly/contracts/catalog/category'
import {
  CATALOG_REPOSITORY,
  type CatalogRepository,
} from './ports/catalog-repository.js'

@Injectable()
export class ListCategoriesUseCase {
  constructor(
    @Inject(CATALOG_REPOSITORY)
    private readonly catalogRepository: CatalogRepository,
  ) {}

  execute(): Promise<Category[]> {
    return this.catalogRepository.listCategories()
  }
}
