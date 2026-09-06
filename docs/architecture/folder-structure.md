# Dearly folder structure

Status: active design

This document defines where Dearly code belongs as the product grows. It is
intentionally organized around product capabilities instead of technical
file types alone.

## The most important distinction

`Category` and `Template` are different domain concepts:

- A `Category` is an occasion-based grouping, such as Love Letter, Birthday
  Letter, or Anniversary Letter.
- A `Template` is one reusable letter structure inside a Category. A Template
  can define its own opening screen, Fields, ordered Elements, media limits,
  and animation vocabulary.
- A `Letter` is a Creator's personalized instance created from one Template.

The relationship is:

```text
Category
  └── many Templates
          └── many Letters created from a Template snapshot
```

Love Letter is therefore never a Template folder containing one Letter. It is
a Category record that can contain many Templates.

## Repository-level ownership

```text
apps/
  api/                 NestJS API and the only trusted application boundary
  web/                 Next.js routes, rendering, and browser interaction
packages/
  contracts/           Zod schemas and TypeScript types crossing API/web
  ui/                  reusable visual primitives and the design system
docs/
  architecture/        maintainability and structure decisions
  adr/                 decisions that are expensive or surprising to reverse
  research/             evidence and compatibility research
infra/                 deployment and reverse-proxy configuration
```

The API owns authorization, domain rules, Prisma, Better Auth server setup,
R2, Redis, and durable state. The web app calls the API and never imports
Prisma or server-only credentials. `packages/contracts` is a boundary package,
not a place for Prisma models or API business logic.

## API structure

The current API has been moved into this shape:

```text
apps/api/src/
  app.module.ts
  main.ts
  config/
    configuration.ts
    configuration.spec.ts
  infrastructure/
    auth/
      auth.ts
    database/
      database.module.ts
      prisma.service.ts
    email/
      email.module.ts
      email-delivery.service.ts
  modules/
    creator/
      creator.module.ts
      creator.controller.ts
      dto/
      guards/
    letters/
      letters.module.ts
      domain/
        letter.ts
      application/
        create-letter-draft.use-case.ts
        list-creator-letters.use-case.ts
        ports/
          letter-repository.ts
      presentation/
        letters.controller.ts
        dto/
          create-letter-draft.dto.ts
          creator-letter-response.dto.ts
      infrastructure/
        prisma-letter.repository.ts
      public/
        public-letters.controller.ts
        public-letters.service.ts
        public-letters.service.spec.ts
    test-mail/
      test-mail.module.ts
      test-mail.controller.ts
      dto/
  platform/
    health/
      health.controller.ts
  generated/
    prisma/            generated code; never edit manually
```

Use these meanings:

- `config` reads and validates process configuration.
- `infrastructure` integrates with external systems or libraries.
- `modules` contains Dearly capabilities. Each module owns its controller,
  application behavior, and later its persistence adapter.
- `platform` contains cross-application operational endpoints such as health.
- `generated` contains generated Prisma output and is not hand-written source.

The current Letter feature separates the Creator Draft slice from the existing
public seeded-Letter slice:

```text
modules/letters/
  domain/                 Letter rules and lifecycle types
  application/            create/list/save/publish use cases and ports
  presentation/           HTTP controllers and response DTOs
  infrastructure/         Prisma repository and future media adapters
  public/                  public Viewer read model and controller
```

The editor, publish, archive, trash, and media behaviors should add files to
these existing seams as they are implemented. Do not move persistence or
authorization rules into the Next.js feature folders.

## Catalog structure for Categories and Templates

Categories and Templates belong together in one `catalog` module because they
are one browsing and selection workflow. They should not be scattered across
the Letter module, the web pages, and seed scripts.

The implemented catalog slice uses this shape:

```text
apps/api/src/modules/catalog/
  catalog.module.ts
  domain/
    category.ts
    template.ts
    template-definition.ts
    template-element.ts
    template-field.ts
  application/
    list-categories.use-case.ts
    list-templates.use-case.ts
    get-template.use-case.ts
    ports/
      catalog-repository.ts
  presentation/
    catalog.controller.ts
  infrastructure/
    in-memory-catalog.repository.ts
    seed/
      categories/
        love-letter.category.ts
        birthday.category.ts
        anniversary.category.ts
      templates/
        love-letter/
          our-story.template.ts
          little-things.template.ts
        birthday/
          make-a-wish.template.ts
          another-year-brighter.template.ts
        anniversary/
          years-together.template.ts
          still-choosing-you.template.ts
```

The catalog remains intentionally curated in memory. Letter Draft persistence
is Prisma-backed, while a Prisma-backed catalog adapter can be introduced later
when catalog administration or database-managed Templates are needed. That
adapter should implement the same repository port without changing the
controller or web feature.

The `categories` and `templates` folders under `seed` are only a convenient
way to organize curated catalog content. The real relationship is still a
Category identifier/foreign key on a Template; folder names must not become
the database model.

Each Template definition should be data-driven and versioned. Conceptually it
contains:

```text
TemplateDefinition
  metadata: slug, name, category, version, description
  openingScreen: optional opening-screen definition
  fields:       typed creator inputs and required/optional rules
  elements:     fixed ordered list of typed element definitions
  limits:       media and content limits
  animations:   small allow-listed animation tokens
```

Use discriminated unions for Fields and Elements. For example, a text Element,
Reveal Element, Audio Element, Photo Gallery, and Animation Element should have
different validated shapes rather than one large object full of optional
properties. Validate external input with Zod/class-validator before it enters
the domain.

The web viewer should have one allow-listed renderer registry:

```text
element type       renderer
text               TextElement
reveal             RevealElement
audio              AudioElement
photo-gallery      PhotoGalleryElement
animation          AnimationElement
```

Adding a Template should normally add catalog data, not a new route, copied
page, or copied editor. Add a new React renderer only when a genuinely new
Element type is introduced. Never execute component names or arbitrary code
from stored Template data.

A Letter stores a Template snapshot when it is created/published. Updating a
catalog Template must not silently change an existing Letter. This follows
ADR-0001.

## Shared contracts package

Keep the public package grouped by API resource:

```text
packages/contracts/src/
  auth/
    creator-profile.ts
  catalog/
    category.ts
    template.ts
    template-element.ts
    template-field.ts
    template-definition.ts
    template-response.ts
  letters/
    create-draft.ts
    creator-letter.ts
    published-letter.ts
  index.ts              public package exports only
```

The current `auth`, `catalog`, and `letters` contract files are organized this
way. Catalog and Creator Letter contracts validate responses at the web API
boundary.

Do not put these in `packages/contracts`:

- Prisma-generated types or a database client;
- Better Auth server configuration;
- R2/Redis clients or secrets;
- rules that require database access;
- React components.

Avoid a barrel `index.ts` in every subfolder. Keep the package root as the
stable public entry point and import feature files directly inside an app.

## Next.js structure

The Next.js `app` directory should contain route files and route-specific
special files. Route groups organize the tree without changing URLs:

```text
apps/web/app/
  (public)/
    page.tsx
    letters/[slug]/page.tsx
    templates/page.tsx
  (auth)/
    sign-in/page.tsx
    sign-up/page.tsx
  (creator)/
    creator/page.tsx
  layout.tsx
  globals.css
  error.tsx
  not-found.tsx
```

The reusable code lives under feature folders:

```text
apps/web/src/
  features/
    auth/
      auth-client.ts
      components/
        auth-shell.tsx
        sign-in-form.tsx
        sign-up-form.tsx
    catalog/
      api/
      components/
      hooks/
    creator/
      api/
      components/
      hooks/
    letters/
      api/
      components/
        elements/
      hooks/
    media/
      api/
      components/
  providers/
    query-provider.tsx
  lib/
    api/                 shared Axios/fetch setup only
  components/
    layout/              only truly cross-feature composition
```

Keep route pages thin: load route parameters, call a feature API function,
handle route-level errors, and compose the feature component. Server Components
should own initial public Letter reads where possible. Small Client Components
should own stateful behavior such as click-to-reveal, audio controls, and GSAP
animation.

TanStack Query hooks belong in the feature that owns the resource. For example,
catalog queries belong in `features/catalog/hooks`, while Creator Letter draft
mutations belong in `features/creator` or `features/letters` according to the
resource they change. Do not put every request into one global `api.ts` file.

## UI package structure

`packages/ui` is a design-system package, not a Dearly feature package:

```text
packages/ui/src/
  components/ui/
    button.tsx
    ...shadcn-primitives...
  lib/
    utils.ts
  index.ts
```

It may contain Button, Dialog, Input, Sheet, and other reusable primitives.
Dearly-specific pieces such as a Template picker, Letter editor toolbar, or
Opening screen belong in `apps/web/src/features`, because they know product
terms and API behavior.

## Dependency rules

Keep dependencies pointing inward toward the owning feature:

```text
HTTP controller
  -> application use case/service
    -> domain rule
      -> repository port
        -> infrastructure adapter (Prisma/R2/Redis)
```

In practice:

- Controllers validate transport input and map responses; they do not contain
  Prisma queries.
- A feature does not import another feature's Prisma model or reach around its
  service. Use a public application interface when coordination is required.
- Infrastructure adapters implement application/domain ports.
- Web code imports `@dearly/contracts` and `@dearly/ui`, never API internals.
- `packages/ui` must not import Dearly feature code.
- A shared helper belongs in `lib` only after at least two features genuinely
  use it. Do not create a global utility folder as a dumping ground.

## Naming rules

- Use Dearly glossary terms: `category`, `template`, `letter`, `element`,
  `field`, `creator`, `viewer`, and `recipient`.
- Use purpose-based filenames: `list-templates.use-case.ts`,
  `template-response.dto.ts`, and `get-template.ts`.
- Keep one primary responsibility per file.
- Prefer direct imports over deep barrel chains.
- Keep generated files, migrations, and seed data visibly separate from
  hand-written application logic.

## Implementation order

The catalog and initial Creator Draft slice are implemented. The next slices
should extend the existing seams in this order:

1. Add the Draft editor using the selected Template's typed Fields and
   Elements.
2. Add `PATCH /letters/:id` with ownership checks and debounced autosave.
3. Add media upload orchestration through private Cloudflare R2 objects.
4. Add publish validation, immutable Template snapshot handling, and the
   public Share link/QR code flow.
5. Add archive/trash lifecycle actions and retention cleanup.

This order keeps the catalog reusable and prevents the editor from becoming a
large component that hardcodes every occasion and Template.
