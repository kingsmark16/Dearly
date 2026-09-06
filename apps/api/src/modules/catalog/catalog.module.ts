import { Module } from '@nestjs/common'
import { GetTemplateUseCase } from './application/get-template.use-case.js'
import { ListCategoriesUseCase } from './application/list-categories.use-case.js'
import { ListTemplatesUseCase } from './application/list-templates.use-case.js'
import { CATALOG_REPOSITORY } from './application/ports/catalog-repository.js'
import { InMemoryCatalogRepository } from './infrastructure/in-memory-catalog.repository.js'
import { CatalogController } from './presentation/catalog.controller.js'

@Module({
  controllers: [CatalogController],
  providers: [
    {
      provide: CATALOG_REPOSITORY,
      useClass: InMemoryCatalogRepository,
    },
    ListCategoriesUseCase,
    ListTemplatesUseCase,
    GetTemplateUseCase,
  ],
})
export class CatalogModule {}
