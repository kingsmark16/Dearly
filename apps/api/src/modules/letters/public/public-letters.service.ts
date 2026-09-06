import { Inject, Injectable, Optional } from '@nestjs/common'
import type { PublishedLetter } from '@dearly/contracts/letters/published-letter'
import { GetPublicLetterUseCase } from './get-public-letter.use-case.js'

type SeededLetter = {
  slug: string
  category: string
  templateName: string
  title: string
  opening: PublishedLetter['opening']
  elements: Extract<PublishedLetter['elements'][number], { type: 'text' }>[]
}

const seededLetter: SeededLetter = {
  slug: 'our-story',
  category: 'Love Letter',
  templateName: 'Our Story',
  title: 'Private dashboard title',
  opening: {
    eyebrow: 'A letter for you',
    title: 'A little piece of us',
    subtitle: 'Take a slow scroll through the moments I never want to forget.',
    ctaLabel: 'Open letter',
  },
  elements: [
    {
      id: 'intro',
      type: 'text',
      heading: 'The moments I keep',
      body: 'Every moment with you feels like home.',
    },
    {
      id: 'promise',
      type: 'text',
      heading: 'A small promise',
      body: 'I will keep choosing the ordinary days with you, because they never feel ordinary.',
    },
  ],
}

function toPublicLetterViewModel(letter: SeededLetter): PublishedLetter {
  return {
    slug: letter.slug,
    category: letter.category,
    templateName: letter.templateName,
    opening: {
      eyebrow: letter.opening.eyebrow,
      title: letter.opening.title,
      subtitle: letter.opening.subtitle,
      ctaLabel: letter.opening.ctaLabel,
    },
    elements: letter.elements.map((element) => ({
      id: element.id,
      type: element.type,
      heading: element.heading,
      body: element.body,
    })),
  }
}

@Injectable()
export class PublicLettersService {
  constructor(
    @Optional()
    @Inject(GetPublicLetterUseCase)
    private readonly getPublicLetterUseCase?: GetPublicLetterUseCase,
  ) {}

  findBySlug(slug: string): PublishedLetter | undefined {
    return slug === seededLetter.slug
      ? toPublicLetterViewModel(seededLetter)
      : undefined
  }

  async findBySlugOrShareToken(
    slugOrShareToken: string,
  ): Promise<PublishedLetter | undefined> {
    const seededLetterView = this.findBySlug(slugOrShareToken)

    if (seededLetterView) {
      return seededLetterView
    }

    return this.getPublicLetterUseCase?.execute(slugOrShareToken)
  }
}
