import { Inject, Injectable } from '@nestjs/common'
import type {
  CreateLetterReportInput,
  LetterReportResponse,
} from '@dearly/contracts/letters/letter-report'
import {
  LETTER_REPORT_REPOSITORY,
  type LetterReportRepository,
} from '../application/ports/letter-repository.js'

export type ReportLetterCommand = CreateLetterReportInput & {
  shareToken: string
}

@Injectable()
export class ReportLetterUseCase {
  constructor(
    @Inject(LETTER_REPORT_REPOSITORY)
    private readonly reportRepository: LetterReportRepository,
  ) {}

  async execute(
    command: ReportLetterCommand,
  ): Promise<LetterReportResponse | undefined> {
    const created = await this.reportRepository.createForPublishedShareToken({
      shareToken: command.shareToken,
      reason: command.reason,
      details: command.details,
    })

    return created ? { status: 'received' } : undefined
  }
}
