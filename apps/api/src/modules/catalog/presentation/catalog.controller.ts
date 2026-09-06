import {
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common'
import { AllowAnonymous } from '@thallesp/nestjs-better-auth'
import { GetTemplateUseCase } from '../application/get-template.use-case.js'
import { ListCategoriesUseCase } from '../application/list-categories.use-case.js'
import { ListTemplatesUseCase } from '../application/list-templates.use-case.js'
import { CatalogCategoryNotFoundError } from '../domain/category.js'
import { CatalogTemplateNotFoundError } from '../domain/template.js'

@AllowAnonymous()
@Controller('catalog')
export class CatalogController {
  constructor(
    @Inject(ListCategoriesUseCase)
    private readonly listCategoriesUseCase: ListCategoriesUseCase,
    @Inject(ListTemplatesUseCase)
    private readonly listTemplatesUseCase: ListTemplatesUseCase,
    @Inject(GetTemplateUseCase)
    private readonly getTemplateUseCase: GetTemplateUseCase,
  ) {}

  @Get('categories')
  listCategories() {
    return this.listCategoriesUseCase.execute()
  }

  @Get('templates')
  listTemplates(@Query('category') categorySlug?: string) {
    return this.listTemplatesUseCase
      .execute(categorySlug)
      .catch((error: unknown) => {
        if (error instanceof CatalogCategoryNotFoundError) {
          throw new NotFoundException('Catalog category not found')
        }

        throw error
      })
  }

  @Get('templates/:slug')
  getTemplate(@Param('slug') slug: string) {
    return this.getTemplateUseCase.execute(slug).catch((error: unknown) => {
      if (error instanceof CatalogTemplateNotFoundError) {
        throw new NotFoundException('Catalog template not found')
      }

      throw error
    })
  }

  @Get('categories/:categorySlug/templates')
  listTemplatesByCategory(@Param('categorySlug') categorySlug: string) {
    return this.listTemplates(categorySlug)
  }
}
