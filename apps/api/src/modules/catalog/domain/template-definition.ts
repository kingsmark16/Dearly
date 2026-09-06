import type { CatalogTemplateElement } from './template-element.js'
import type { CatalogTemplateField } from './template-field.js'

export type CatalogTemplateDefinition = {
  openingScreen: {
    eyebrow: string
    title: string
    subtitle: string
    ctaLabel: string
  }
  fields: CatalogTemplateField[]
  elements: CatalogTemplateElement[]
  limits: {
    maxPhotosPerGallery: number
    maxAudioDurationSeconds: number
  }
}
