import { describe, expect, it } from 'vitest'
import { PublicLettersService } from './public-letters.service.js'

describe('PublicLettersService', () => {
  it('returns a safe public view model without the private Letter title', () => {
    const service = new PublicLettersService()

    const letter = service.findBySlug('our-story')

    expect(letter).toMatchObject({
      slug: 'our-story',
      opening: { title: 'A little piece of us' },
    })
    expect(letter).not.toHaveProperty('title')
  })

  it('returns no Letter for an unknown slug', () => {
    const service = new PublicLettersService()

    expect(service.findBySlug('missing-letter')).toBeUndefined()
  })
})
