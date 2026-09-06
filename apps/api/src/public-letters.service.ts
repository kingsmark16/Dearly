import { Injectable } from '@nestjs/common'
import type { PublishedLetter } from '@dearly/contracts'

type SeededLetter = {
  slug: string
  category: string
  templateName: string
  title: string
  opening: PublishedLetter['opening']
  elements: PublishedLetter['elements']
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
  findBySlug(slug: string): PublishedLetter | undefined {
    return slug === seededLetter.slug
      ? toPublicLetterViewModel(seededLetter)
      : undefined
  }
}
