import { Controller, Get, SerializeOptions, UseGuards } from '@nestjs/common'
import { Session, type UserSession } from '@thallesp/nestjs-better-auth'
import {
  CreatorProfileResponseDto,
  CreatorResponseDto,
} from './dto/creator-response.dto.js'
import { VerifiedCreatorGuard } from './guards/verified-creator.guard.js'

@Controller('creator')
@UseGuards(VerifiedCreatorGuard)
export class CreatorController {
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
}
