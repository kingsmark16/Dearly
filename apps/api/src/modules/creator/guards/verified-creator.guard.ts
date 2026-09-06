import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common'

type AuthenticatedRequest = {
  user?: {
    emailVerified?: boolean
  } | null
}

@Injectable()
export class VerifiedCreatorGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()

    if (!request.user?.emailVerified) {
      throw new ForbiddenException(
        'Verify your email before entering the Creator area',
      )
    }

    return true
  }
}
