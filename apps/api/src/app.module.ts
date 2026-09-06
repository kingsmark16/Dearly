import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { AuthModule } from '@thallesp/nestjs-better-auth'
import { createAuth } from './auth.js'
import {
  environmentValidationSchema,
  validateEnvironment,
} from './configuration.js'
import { CreatorModule } from './creator/creator.module.js'
import { DatabaseModule } from './database.module.js'
import { EmailDeliveryService } from './email-delivery.service.js'
import { EmailModule } from './email.module.js'
import { HealthController } from './health.controller.js'
import { PublicLettersController } from './public-letters.controller.js'
import { PublicLettersService } from './public-letters.service.js'
import { PrismaService } from './prisma.service.js'
import { TestMailModule } from './test-mail.module.js'

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
  controllers: [HealthController, PublicLettersController],
  providers: [PublicLettersService],
})
export class AppModule {}
