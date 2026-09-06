import { z } from 'zod'

const textElementSchema = z.object({
  id: z.string().min(1),
  type: z.literal('text'),
  heading: z.string().min(1),
  body: z.string().min(1),
})

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
  elements: z.array(textElementSchema).min(1),
})

export type PublishedLetter = z.infer<typeof PublishedLetterSchema>

export const CreatorProfileSchema = z.object({
  creator: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    email: z.string().email(),
    emailVerified: z.literal(true),
  }),
})

export type CreatorProfile = z.infer<typeof CreatorProfileSchema>
