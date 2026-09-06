import { z } from 'zod'

const textElementSchema = z.object({
  id: z.string().min(1),
  type: z.literal('text'),
  heading: z.string().min(1),
  body: z.string().min(1),
})

const revealElementSchema = z.object({
  id: z.string().min(1),
  type: z.literal('reveal'),
  heading: z.string().min(1),
  prompt: z.string().min(1),
  body: z.string().min(1),
})

const photoSchema = z.object({
  id: z.string().min(1),
  url: z.string().url(),
  alt: z.string().min(1),
})

const audioElementSchema = z.object({
  id: z.string().min(1),
  type: z.literal('audio'),
  label: z.string().min(1),
  url: z.string().url(),
})

const photoGalleryElementSchema = z.object({
  id: z.string().min(1),
  type: z.literal('photo-gallery'),
  heading: z.string().min(1),
  photos: z.array(photoSchema).min(1),
})

const animationElementSchema = z.object({
  id: z.string().min(1),
  type: z.literal('animation'),
  token: z.enum(['hearts', 'sparkles', 'petals', 'confetti']),
  trigger: z.enum(['on-open', 'on-scroll']),
})

export const PublishedLetterElementSchema = z.discriminatedUnion('type', [
  textElementSchema,
  revealElementSchema,
  audioElementSchema,
  photoGalleryElementSchema,
  animationElementSchema,
])

export const PublishedLetterSchema = z.object({
  slug: z.string().min(1),
  category: z.string().min(1),
  templateName: z.string().min(1),
  opening: z.object({
    eyebrow: z.string().min(1),
    title: z.string().min(1),
    subtitle: z.string().min(1),
    ctaLabel: z.string().min(1),
  }),
  elements: z.array(PublishedLetterElementSchema).min(1),
})

export type PublishedLetterElement = z.infer<
  typeof PublishedLetterElementSchema
>
export type PublishedLetter = z.infer<typeof PublishedLetterSchema>
