import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { CatalogModule } from '../catalog/catalog.module.js'
import { ChangeLetterLifecycleUseCase } from './application/change-letter-lifecycle.use-case.js'
import { CleanupExpiredLettersUseCase } from './application/cleanup-expired-letters.use-case.js'
import { CreateLetterDraftUseCase } from './application/create-letter-draft.use-case.js'
import { GetCreatorLetterUseCase } from './application/get-creator-letter.use-case.js'
import { ListCreatorLettersUseCase } from './application/list-creator-letters.use-case.js'
import { PublishLetterUseCase } from './application/publish-letter.use-case.js'
import {
  CREATOR_LETTER_READER,
  LETTER_EDITOR_REPOSITORY,
  LETTER_LIFECYCLE_REPOSITORY,
  LETTER_PUBLISHING_REPOSITORY,
  LETTER_REPOSITORY,
  PUBLISHED_LETTER_READER,
} from './application/ports/letter-repository.js'
import { UpdateLetterUseCase } from './application/update-letter.use-case.js'
import { PrismaLetterRepository } from './infrastructure/prisma-letter.repository.js'
import { LettersController } from './presentation/letters.controller.js'
import { PublicLettersController } from './public/public-letters.controller.js'
import { PublicLettersService } from './public/public-letters.service.js'
import { GetPublicLetterUseCase } from './public/get-public-letter.use-case.js'
import { LetterRetentionScheduler } from './infrastructure/letter-retention.scheduler.js'
import { CompleteMediaUploadUseCase } from './media/application/complete-media-upload.use-case.js'
import { CreateMediaUploadIntentUseCase } from './media/application/create-media-upload-intent.use-case.js'
import { DeleteMediaAssetUseCase } from './media/application/delete-media-asset.use-case.js'
import { GetCreatorLetterMediaUseCase } from './media/application/get-creator-letter-media.use-case.js'
import { MEDIA_ASSET_REPOSITORY } from './media/application/ports/media-asset-repository.js'
import {
  LOCAL_OBJECT_STORAGE,
  OBJECT_STORAGE,
} from './media/application/ports/object-storage.js'
import { ReorderMediaGalleryUseCase } from './media/application/reorder-media-gallery.use-case.js'
import { InMemoryObjectStorage } from './media/infrastructure/in-memory-object-storage.js'
import { PrismaMediaAssetRepository } from './media/infrastructure/prisma-media-asset.repository.js'
import { R2ObjectStorage } from './media/infrastructure/r2-object-storage.js'
import { LetterMediaController } from './media/presentation/letter-media.controller.js'
import { LocalMediaStorageController } from './media/presentation/local-media-storage.controller.js'

@Module({
  imports: [CatalogModule],
  controllers: [
    LettersController,
    PublicLettersController,
    LetterMediaController,
    LocalMediaStorageController,
  ],
  providers: [
    PublicLettersService,
    PrismaLetterRepository,
    {
      provide: LETTER_REPOSITORY,
      useExisting: PrismaLetterRepository,
    },
    {
      provide: CREATOR_LETTER_READER,
      useExisting: PrismaLetterRepository,
    },
    {
      provide: LETTER_EDITOR_REPOSITORY,
      useExisting: PrismaLetterRepository,
    },
    {
      provide: LETTER_LIFECYCLE_REPOSITORY,
      useExisting: PrismaLetterRepository,
    },
    {
      provide: LETTER_PUBLISHING_REPOSITORY,
      useExisting: PrismaLetterRepository,
    },
    {
      provide: PUBLISHED_LETTER_READER,
      useExisting: PrismaLetterRepository,
    },
    CreateLetterDraftUseCase,
    GetCreatorLetterUseCase,
    ListCreatorLettersUseCase,
    UpdateLetterUseCase,
    PublishLetterUseCase,
    ChangeLetterLifecycleUseCase,
    CleanupExpiredLettersUseCase,
    LetterRetentionScheduler,
    {
      provide: MEDIA_ASSET_REPOSITORY,
      useClass: PrismaMediaAssetRepository,
    },
    InMemoryObjectStorage,
    {
      provide: OBJECT_STORAGE,
      inject: [ConfigService, InMemoryObjectStorage],
      useFactory: (
        configService: ConfigService,
        inMemoryObjectStorage: InMemoryObjectStorage,
      ) =>
        configService.get<string>('MEDIA_STORAGE_DRIVER') === 'r2'
          ? new R2ObjectStorage(configService)
          : inMemoryObjectStorage,
    },
    {
      provide: LOCAL_OBJECT_STORAGE,
      inject: [ConfigService, InMemoryObjectStorage],
      useFactory: (
        configService: ConfigService,
        inMemoryObjectStorage: InMemoryObjectStorage,
      ) =>
        configService.get<string>('MEDIA_STORAGE_DRIVER') === 'memory'
          ? inMemoryObjectStorage
          : null,
    },
    CreateMediaUploadIntentUseCase,
    CompleteMediaUploadUseCase,
    DeleteMediaAssetUseCase,
    GetCreatorLetterMediaUseCase,
    ReorderMediaGalleryUseCase,
    GetPublicLetterUseCase,
  ],
})
export class LettersModule {}
