import 'reflect-metadata'
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory, Reflector } from '@nestjs/core'
import { AppModule } from './app.module.js'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false })
  app.enableShutdownHooks()

  app.setGlobalPrefix('api/v1')
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)))

  const configService = app.get(ConfigService)
  const configuredOrigins = configService
    .getOrThrow<string>('WEB_ORIGIN')
    .split(',')
    .map((origin: string) => origin.trim())
    .filter(Boolean)

  app.enableCors({
    origin: configuredOrigins,
    credentials: true,
  })

  await app.listen(configService.getOrThrow<number>('PORT'), '0.0.0.0')
}

void bootstrap()
