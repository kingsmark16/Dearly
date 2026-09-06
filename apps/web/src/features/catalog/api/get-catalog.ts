import { CategoryListSchema } from '@dearly/contracts/catalog/category'
import { TemplateListSchema } from '@dearly/contracts/catalog/template'
import axios from 'axios'

function getApiBaseUrl() {
  const configuredApiUrl = process.env.DEARLY_API_URL

  if (configuredApiUrl) {
    return configuredApiUrl
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('DEARLY_API_URL must be configured in production')
  }

  return 'http://127.0.0.1:4000/api/v1'
}

function createApiClient() {
  return axios.create({
    baseURL: getApiBaseUrl(),
    timeout: 5_000,
    headers: { Accept: 'application/json' },
  })
}

export async function getCatalog() {
  const client = createApiClient()
  const [categoriesResponse, templatesResponse] = await Promise.all([
    client.get('/catalog/categories'),
    client.get('/catalog/templates'),
  ])

  return {
    categories: CategoryListSchema.parse(categoriesResponse.data),
    templates: TemplateListSchema.parse(templatesResponse.data),
  }
}
