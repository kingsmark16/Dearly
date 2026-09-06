import 'reflect-metadata'
import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module.js'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.setGlobalPrefix('api/v1')
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  )

  const configuredOrigins = process.env.WEB_ORIGIN?.split(',')
    .map((origin: string) => origin.trim())
    .filter(Boolean)

  if (process.env.NODE_ENV === 'production' && !configuredOrigins?.length) {
    throw new Error('WEB_ORIGIN must be configured in production')
  }

  app.enableCors({
    origin: configuredOrigins?.length
      ? configuredOrigins
      : ['http://127.0.0.1:3000'],
    credentials: true,
  })

  await app.listen(Number(process.env.PORT ?? 4000), '0.0.0.0')
}

void bootstrap()
