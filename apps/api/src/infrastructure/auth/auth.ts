import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { Logger } from '@nestjs/common'
import type { ConfigService } from '@nestjs/config'
import type { PrismaClient } from '../../generated/prisma/client.js'
import type { EmailDeliveryService } from '../email/email-delivery.service.js'

export function createAuth(
  prisma: PrismaClient,
  configService: ConfigService,
  emailDeliveryService: EmailDeliveryService,
) {
  const logger = new Logger('BetterAuth')
  const trustedOrigins = configService
    .getOrThrow<string>('WEB_ORIGIN')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

  async function isCreatorAvailable(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { deletionRequestedAt: true },
    })

    return Boolean(user && !user.deletionRequestedAt)
  }

  return betterAuth({
    database: prismaAdapter(prisma, {
      provider: 'postgresql',
    }),
    baseURL: configService.getOrThrow<string>('BETTER_AUTH_URL'),
    basePath: '/api/auth',
    secret: configService.getOrThrow<string>('BETTER_AUTH_SECRET'),
    trustedOrigins,
    rateLimit: {
      enabled: configService.getOrThrow<boolean>('AUTH_RATE_LIMIT_ENABLED'),
      window: 60,
      max: 100,
    },
    databaseHooks: {
      account: {
        create: {
          before: async (account) => isCreatorAvailable(account.userId),
        },
      },
      session: {
        create: {
          // This remains a second boundary if a future provider attempts to
          // recreate an Account for a retained, pending-deletion Creator.
          before: async (session) => isCreatorAvailable(session.userId),
        },
      },
    },
    emailAndPassword: {
      enabled: true,
      autoSignIn: false,
      requireEmailVerification: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
    },
    emailVerification: {
      sendOnSignUp: true,
      sendOnSignIn: true,
      autoSignInAfterVerification: true,
      expiresIn: 60 * 60,
      sendVerificationEmail: async ({ user, url }) => {
        try {
          await emailDeliveryService.sendVerificationEmail({
            recipient: user.email,
            verificationUrl: url,
          })
        } catch (error: unknown) {
          logger.error(
            'Unable to deliver Dearly verification email',
            error instanceof Error ? error.stack : String(error),
          )
          throw error
        }
      },
    },
  })
}

export type DearlyAuth = ReturnType<typeof createAuth>
