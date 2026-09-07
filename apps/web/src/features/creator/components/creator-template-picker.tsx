'use client'

import type { Category } from '@dearly/contracts/catalog/category'
import type { TemplateSummary } from '@dearly/contracts/catalog/template'
import { groupTemplatesByCategory } from '../../catalog/lib/group-templates-by-category'
import { TemplatePreview } from '../../catalog/components/template-preview'

export function CreatorTemplatePicker({
  categories,
  templates,
  onSelect,
  isCreating,
  selectedTemplateSlug,
}: {
  categories: Category[]
  templates: TemplateSummary[]
  onSelect: (templateSlug: string) => void
  isCreating: boolean
  selectedTemplateSlug: string | null
}) {
  const templatesByCategory = groupTemplatesByCategory(templates)

  return (
    <div className="space-y-8">
      {categories.map((category) => {
        const categoryTemplates = templatesByCategory.get(category.slug) ?? []

        return (
          <section
            key={category.slug}
            aria-labelledby={`${category.slug}-picker`}
          >
            <div className="flex items-end justify-between gap-4">
              <div>
                <h3
                  id={`${category.slug}-picker`}
                  className="text-2xl leading-tight"
                >
                  {category.name}
                </h3>
                <p className="mt-1 text-sm text-[var(--dearly-muted)]">
                  {category.description}
                </p>
              </div>
              <span className="shrink-0 text-xs text-[var(--dearly-muted)]">
                {category.templateCount}{' '}
                {category.templateCount === 1 ? 'template' : 'templates'}
              </span>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {categoryTemplates.map((template) => (
                <article
                  key={template.slug}
                  className="rounded-2xl border border-[var(--dearly-blush)] bg-white/70 p-4 sm:p-5"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--dearly-plum)]">
                    Version {template.version}
                  </p>
                  <h4 className="mt-2 text-2xl leading-tight">
                    {template.name}
                  </h4>
                  <p className="mt-3 flex-1 text-sm leading-6 text-[var(--dearly-muted)]">
                    {template.description}
                  </p>
                  <div className="mt-5">
                    <TemplatePreview
                      action={
                        <button
                          className="min-h-10 rounded-full border border-[var(--dearly-plum)] px-4 py-2 text-sm font-semibold text-[var(--dearly-plum)] transition hover:bg-[var(--dearly-plum)] hover:text-white disabled:cursor-wait disabled:opacity-60"
                          disabled={isCreating}
                          onClick={() => onSelect(template.slug)}
                          type="button"
                        >
                          {isCreating && selectedTemplateSlug === template.slug
                            ? 'Creating draft…'
                            : `Create draft with ${template.name}`}
                        </button>
                      }
                      template={template}
                    />
                  </div>
                </article>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
