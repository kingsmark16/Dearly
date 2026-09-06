import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { AuthModule } from '@thallesp/nestjs-better-auth'
import { createAuth } from './infrastructure/auth/auth.js'
import {
  environmentValidationSchema,
  validateEnvironment,
} from './config/configuration.js'
import { DatabaseModule } from './infrastructure/database/database.module.js'
import { EmailDeliveryService } from './infrastructure/email/email-delivery.service.js'
import { EmailModule } from './infrastructure/email/email.module.js'
import { CreatorModule } from './modules/creator/creator.module.js'
import { CatalogModule } from './modules/catalog/catalog.module.js'
import { LettersModule } from './modules/letters/letters.module.js'
import { TestMailModule } from './modules/test-mail/test-mail.module.js'
import { HealthController } from './platform/health/health.controller.js'
import { PrismaService } from './infrastructure/database/prisma.service.js'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
      validationSchema: environmentValidationSchema,
      validate: validateEnvironment,
    }),
    DatabaseModule,
    EmailModule,
    CreatorModule,
    CatalogModule,
    LettersModule,
    AuthModule.forRootAsync({
      imports: [DatabaseModule, EmailModule],
      inject: [PrismaService, ConfigService, EmailDeliveryService],
      useFactory: (
        prisma: PrismaService,
        configService: ConfigService,
        emailDelivery: EmailDeliveryService,
      ) => ({
        auth: createAuth(prisma, configService, emailDelivery),
      }),
    }),
    TestMailModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
