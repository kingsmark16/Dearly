import type { CatalogTemplateSeed } from '../../domain/template.js'
import { anniversaryCategory } from './categories/anniversary.category.js'
import { birthdayCategory } from './categories/birthday.category.js'
import { loveLetterCategory } from './categories/love-letter.category.js'
import { anotherYearBrighterTemplate } from './templates/birthday/another-year-brighter.template.js'
import { makeAWishTemplate } from './templates/birthday/make-a-wish.template.js'
import { stillChoosingYouTemplate } from './templates/anniversary/still-choosing-you.template.js'
import { yearsTogetherTemplate } from './templates/anniversary/years-together.template.js'
import { littleThingsTemplate } from './templates/love-letter/little-things.template.js'
import { ourStoryTemplate } from './templates/love-letter/our-story.template.js'

export const catalogCategories = [
  loveLetterCategory,
  birthdayCategory,
  anniversaryCategory,
]

export const catalogTemplates = [
  ourStoryTemplate,
  littleThingsTemplate,
  makeAWishTemplate,
  anotherYearBrighterTemplate,
  yearsTogetherTemplate,
  stillChoosingYouTemplate,
] satisfies CatalogTemplateSeed[]
