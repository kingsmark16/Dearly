import { getCatalog } from '../../../src/features/catalog/api/get-catalog'
import { CatalogBrowser } from '../../../src/features/catalog/components/catalog-browser'

export const dynamic = 'force-dynamic'

export default async function TemplatesPage() {
  const { categories, templates } = await getCatalog()

  return <CatalogBrowser categories={categories} templates={templates} />
}
