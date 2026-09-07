import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  NotFoundException,
  SerializeOptions,
  UseGuards,
} from '@nestjs/common'
import { Session, type UserSession } from '@thallesp/nestjs-better-auth'
import { DeleteCreatorAccountUseCase } from './application/delete-creator-account.use-case.js'
import {
  CreatorAccountDeletionValidationError,
  CreatorAccountNotFoundError,
} from './domain/creator-account.js'
import {
  CreatorProfileResponseDto,
  CreatorResponseDto,
} from './dto/creator-response.dto.js'
import { DeleteCreatorAccountDto } from './presentation/dto/delete-creator-account.dto.js'
import { VerifiedCreatorGuard } from './guards/verified-creator.guard.js'

@Controller('creator')
@UseGuards(VerifiedCreatorGuard)
export class CreatorController {
  constructor(
    @Inject(DeleteCreatorAccountUseCase)
    private readonly deleteCreatorAccountUseCase: DeleteCreatorAccountUseCase,
  ) {}

  @Get('me')
  @SerializeOptions({ excludeExtraneousValues: true })
  getCurrentCreator(@Session() session: UserSession) {
    return new CreatorProfileResponseDto({
      creator: new CreatorResponseDto({
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        emailVerified: session.user.emailVerified,
      }),
    })
  }

  @Delete('me')
  async deleteCurrentCreator(
    @Session() session: UserSession,
    @Body() input: DeleteCreatorAccountDto,
  ) {
    try {
      return await this.deleteCreatorAccountUseCase.execute({
        creatorId: session.user.id,
        confirmation: input.confirmation,
      })
    } catch (error: unknown) {
      if (error instanceof CreatorAccountDeletionValidationError) {
        throw new BadRequestException(error.message)
      }

      if (error instanceof CreatorAccountNotFoundError) {
        throw new NotFoundException('Creator account not found')
      }

      throw error
    }
  }
}
