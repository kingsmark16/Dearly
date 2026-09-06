import { CategoryListSchema } from '@dearly/contracts/catalog/category'
import { TemplateListSchema } from '@dearly/contracts/catalog/template'
import { browserApiClient } from '../../../lib/api/browser-api-client'

export async function getCatalogForBrowser() {
  const [categoriesResponse, templatesResponse] = await Promise.all([
    browserApiClient.get('/catalog/categories'),
    browserApiClient.get('/catalog/templates'),
  ])

  return {
    categories: CategoryListSchema.parse(categoriesResponse.data),
    templates: TemplateListSchema.parse(templatesResponse.data),
  }
}
