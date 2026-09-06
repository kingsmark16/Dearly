import Link from 'next/link'
import type { Category } from '@dearly/contracts/catalog/category'
import type { TemplateSummary } from '@dearly/contracts/catalog/template'
import { groupTemplatesByCategory } from '../lib/group-templates-by-category'

export function CatalogBrowser({
  categories,
  templates,
}: {
  categories: Category[]
  templates: TemplateSummary[]
}) {
  const templatesByCategory = groupTemplatesByCategory(templates)

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-12 sm:px-10 sm:py-20">
      <header className="mx-auto max-w-3xl text-center">
        <Link
          className="text-sm uppercase tracking-[0.3em] text-[var(--dearly-plum)]"
          href="/"
        >
          Dearly
        </Link>
        <p className="mt-8 text-sm uppercase tracking-[0.24em] text-[var(--dearly-muted)]">
          The template collection
        </p>
        <h1 className="mt-4 text-5xl leading-tight tracking-tight sm:text-6xl">
          Choose a Dearly template
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[var(--dearly-muted)]">
          Start with a thoughtfully arranged story, then fill it with the words,
          photos, and sounds that are yours.
        </p>
      </header>

      <div className="mt-16 space-y-16">
        {categories.map((category) => {
          const categoryTemplates = templatesByCategory.get(category.slug) ?? []

          return (
            <section
              key={category.slug}
              aria-labelledby={`${category.slug}-heading`}
            >
              <div className="flex flex-col gap-3 border-b border-[var(--dearly-blush)] pb-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2
                    id={`${category.slug}-heading`}
                    className="text-3xl leading-tight sm:text-4xl"
                  >
                    {category.name}
                  </h2>
                  <p className="mt-2 max-w-2xl text-[var(--dearly-muted)]">
                    {category.description}
                  </p>
                </div>
                <p className="shrink-0 text-sm text-[var(--dearly-muted)]">
                  {category.templateCount}{' '}
                  {category.templateCount === 1 ? 'template' : 'templates'}
                </p>
              </div>

              {categoryTemplates.length > 0 ? (
                <div className="mt-7 grid gap-5 md:grid-cols-2">
                  {categoryTemplates.map((template) => (
                    <article
                      key={template.slug}
                      className="flex min-h-64 flex-col rounded-[1.75rem] border border-white/80 bg-white/75 p-7 shadow-[0_1.5rem_4rem_rgb(122_83_110/0.1)] backdrop-blur transition hover:-translate-y-1 hover:shadow-[0_1.75rem_4rem_rgb(122_83_110/0.16)]"
                    >
                      <div className="flex items-start justify-between gap-5">
                        <div>
                          <p className="text-xs uppercase tracking-[0.24em] text-[var(--dearly-plum)]">
                            Template{' '}
                            {String(template.displayOrder).padStart(2, '0')}
                          </p>
                          <h3 className="mt-3 text-3xl leading-tight">
                            {template.name}
                          </h3>
                        </div>
                        <span className="rounded-full bg-[var(--dearly-blush)] px-3 py-1 text-xs text-[var(--dearly-plum)]">
                          v{template.version}
                        </span>
                      </div>
                      <p className="mt-5 flex-1 leading-7 text-[var(--dearly-muted)]">
                        {template.description}
                      </p>
                      <Link
                        className="mt-7 inline-flex min-h-11 w-fit items-center justify-center rounded-full bg-[var(--dearly-plum)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
                        href="/sign-up"
                      >
                        Use this template
                      </Link>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="mt-7 rounded-2xl border border-dashed border-[var(--dearly-blush)] p-6 text-[var(--dearly-muted)]">
                  New templates are on their way.
                </p>
              )}
            </section>
          )
        })}
      </div>
    </main>
  )
}
