import { z } from 'zod'

export const LETTER_REPORT_REASONS = [
  'inappropriate-content',
  'harassment-or-abuse',
  'personal-information',
  'copyright',
  'other',
] as const

export const LetterReportReasonSchema = z.enum(LETTER_REPORT_REASONS)

export const CreateLetterReportInputSchema = z.object({
  reason: LetterReportReasonSchema,
  details: z.string().trim().max(1000).optional(),
})

export const LetterReportResponseSchema = z.object({
  status: z.literal('received'),
})

export type LetterReportReason = z.infer<typeof LetterReportReasonSchema>
export type CreateLetterReportInput = z.infer<
  typeof CreateLetterReportInputSchema
>
export type LetterReportResponse = z.infer<typeof LetterReportResponseSchema>
