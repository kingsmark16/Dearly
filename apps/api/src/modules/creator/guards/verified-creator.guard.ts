import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common'
import { PrismaService } from '../../../infrastructure/database/prisma.service.js'

type AuthenticatedRequest = {
  user?: {
    id?: string
    emailVerified?: boolean
  } | null
}

@Injectable()
export class VerifiedCreatorGuard implements CanActivate {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const user = request?.user

    if (!user?.emailVerified) {
      throw new ForbiddenException(
        'Verify your email before entering the Creator area',
      )
    }

    const creator = user.id
      ? await this.prisma.user.findUnique({
          where: { id: user.id },
          select: { deletionRequestedAt: true },
        })
      : null

    if (!creator || creator.deletionRequestedAt) {
      throw new ForbiddenException('This Creator account is unavailable')
    }

    return true
  }
}
