import {
  CreateLetterReportInputSchema,
  LetterReportResponseSchema,
  type CreateLetterReportInput,
  type LetterReportResponse,
} from '@dearly/contracts/letters/letter-report'
import { browserApiClient } from '../../../lib/api/browser-api-client'

export async function reportPublishedLetter(
  shareToken: string,
  input: CreateLetterReportInput,
): Promise<LetterReportResponse> {
  const validInput = CreateLetterReportInputSchema.parse(input)
  const response = await browserApiClient.post(
    `/public/letters/${encodeURIComponent(shareToken)}/report`,
    validInput,
  )

  return LetterReportResponseSchema.parse(response.data)
}
