import type { CreatorLetterDraft } from '@dearly/contracts/letters/creator-letter'
import type {
  TemplateElement,
  TemplateTextContent,
} from '@dearly/contracts/catalog/template-element'
import type { CreatorMediaAsset } from '@dearly/contracts/letters/media'

type DraftTemplate = CreatorLetterDraft['template']
type DraftField = DraftTemplate['definition']['fields'][number]
type ReadyMediaAsset = CreatorMediaAsset & {
  status: 'ready'
  previewUrl: string
}

export type LetterStoryRequiredField = {
  fieldId: string
  fieldLabel: string
  message: string
}

export type LetterStoryModelElement =
  | {
      id: string
      type: 'text'
      heading: string
      body: string
    }
  | {
      id: string
      type: 'reveal'
      heading: string
      prompt: string
      body: string
    }
  | {
      id: string
      type: 'audio'
      label: string
      asset: ReadyMediaAsset
    }
  | {
      id: string
      type: 'photo-gallery'
      heading: string
      assets: ReadyMediaAsset[]
    }
  | {
      id: string
      type: 'animation'
      token: Extract<TemplateElement, { type: 'animation' }>['token']
      trigger: Extract<TemplateElement, { type: 'animation' }>['trigger']
    }
  | {
      id: string
      type: 'required-blocker'
      heading: string
      fieldId: string
      fieldLabel: string
      message: string
    }

export type LetterStoryModel = {
  categoryName: string
  templateName: string
  opening: DraftTemplate['definition']['openingScreen']
  elements: LetterStoryModelElement[]
  requiredFields: LetterStoryRequiredField[]
}

type FieldResolution = {
  complete: boolean
  present: boolean
  textValue: string | null
  mediaAssets: ReadyMediaAsset[]
}

export type LetterStoryModelInput = {
  template: DraftTemplate
  content: CreatorLetterDraft['content']
  mediaAssets: CreatorMediaAsset[]
}

function getTextValue(content: CreatorLetterDraft['content'], fieldId: string) {
  const value = content[fieldId]
  return typeof value === 'string' ? value : null
}

function getMediaIds(value: unknown) {
  if (typeof value === 'string') {
    return [value]
  }

  if (!Array.isArray(value)) {
    return []
  }

  return value.filter(
    (candidate): candidate is string => typeof candidate === 'string',
  )
}

function getReadyMediaAssets(
  field: DraftField,
  content: CreatorLetterDraft['content'],
  mediaAssets: CreatorMediaAsset[],
) {
  const expectedKind =
    field.type === 'audio'
      ? 'audio'
      : field.type === 'photo' || field.type === 'photo-gallery'
        ? 'photo'
        : null

  if (!expectedKind) {
    return []
  }

  const assetsById = new Map(mediaAssets.map((asset) => [asset.id, asset]))

  return getMediaIds(content[field.id])
    .map((assetId) => assetsById.get(assetId))
    .filter((asset): asset is ReadyMediaAsset => {
      if (!asset) {
        return false
      }

      return (
        asset.fieldId === field.id &&
        asset.kind === expectedKind &&
        asset.status === 'ready' &&
        asset.previewUrl !== null
      )
    })
}

function resolveField(
  field: DraftField,
  content: CreatorLetterDraft['content'],
  mediaAssets: CreatorMediaAsset[],
): FieldResolution {
  if (
    field.type === 'text' ||
    field.type === 'rich-text' ||
    field.type === 'recipient-name'
  ) {
    const textValue = getTextValue(content, field.id)
    const present = Boolean(textValue?.trim())

    return {
      complete: present,
      present,
      textValue,
      mediaAssets: [],
    }
  }

  const resolvedMediaAssets = getReadyMediaAssets(field, content, mediaAssets)
  const present = resolvedMediaAssets.length > 0
  const complete =
    field.type === 'photo-gallery'
      ? resolvedMediaAssets.length >= field.minItems
      : present

  return {
    complete,
    present,
    textValue: null,
    mediaAssets: resolvedMediaAssets,
  }
}

function getRequiredFieldMessage(field: DraftField) {
  if (field.type === 'photo-gallery') {
    return `${field.label} is required before publishing. Add at least ${field.minItems} photos.`
  }

  return `${field.label} is required before publishing.`
}

function findField(template: DraftTemplate, fieldId: string) {
  return template.definition.fields.find((field) => field.id === fieldId)
}

function resolveTextContent(
  body: TemplateTextContent,
  template: DraftTemplate,
  content: CreatorLetterDraft['content'],
  mediaAssets: CreatorMediaAsset[],
) {
  if (body.kind === 'static') {
    return { value: body.value, field: null, resolution: null }
  }

  const field = findField(template, body.fieldId)

  if (!field) {
    return { value: null, field: null, resolution: null }
  }

  const resolution = resolveField(field, content, mediaAssets)

  return { value: resolution.textValue, field, resolution }
}

function createRequiredBlocker(
  id: string,
  heading: string,
  field: DraftField,
): LetterStoryModelElement {
  return {
    id,
    type: 'required-blocker',
    heading,
    fieldId: field.id,
    fieldLabel: field.label,
    message: getRequiredFieldMessage(field),
  }
}

function addTextElement(
  elements: LetterStoryModelElement[],
  element: Extract<TemplateElement, { type: 'text' }>,
  input: LetterStoryModelInput,
) {
  const resolved = resolveTextContent(
    element.body,
    input.template,
    input.content,
    input.mediaAssets,
  )

  if (resolved.value && resolved.value.trim()) {
    elements.push({
      id: element.id,
      type: 'text',
      heading: element.heading,
      body: resolved.value,
    })
    return
  }

  if (resolved.field?.required) {
    elements.push(
      createRequiredBlocker(element.id, element.heading, resolved.field),
    )
  }
}

function addRevealElement(
  elements: LetterStoryModelElement[],
  element: Extract<TemplateElement, { type: 'reveal' }>,
  input: LetterStoryModelInput,
) {
  const resolved = resolveTextContent(
    element.body,
    input.template,
    input.content,
    input.mediaAssets,
  )

  if (resolved.value && resolved.value.trim()) {
    elements.push({
      id: element.id,
      type: 'reveal',
      heading: element.heading,
      prompt: element.prompt,
      body: resolved.value,
    })
    return
  }

  if (resolved.field?.required) {
    elements.push(
      createRequiredBlocker(element.id, element.heading, resolved.field),
    )
  }
}

function addAudioElement(
  elements: LetterStoryModelElement[],
  element: Extract<TemplateElement, { type: 'audio' }>,
  input: LetterStoryModelInput,
) {
  const field = findField(input.template, element.fieldId)

  if (!field || field.type !== 'audio') {
    return
  }

  const resolution = resolveField(field, input.content, input.mediaAssets)

  if (resolution.present && resolution.complete) {
    const [asset] = resolution.mediaAssets

    if (asset) {
      elements.push({
        id: element.id,
        type: 'audio',
        label: element.label,
        asset,
      })
    }
    return
  }

  if (field.required) {
    elements.push(createRequiredBlocker(element.id, element.label, field))
  }
}

function addPhotoGalleryElement(
  elements: LetterStoryModelElement[],
  element: Extract<TemplateElement, { type: 'photo-gallery' }>,
  input: LetterStoryModelInput,
) {
  const field = findField(input.template, element.fieldId)

  if (!field || (field.type !== 'photo' && field.type !== 'photo-gallery')) {
    return
  }

  const resolution = resolveField(field, input.content, input.mediaAssets)

  if (resolution.present && (!field.required || resolution.complete)) {
    elements.push({
      id: element.id,
      type: 'photo-gallery',
      heading: element.heading,
      assets: resolution.mediaAssets,
    })
    return
  }

  if (field.required) {
    elements.push(createRequiredBlocker(element.id, element.heading, field))
  }
}

function createElements(input: LetterStoryModelInput) {
  const elements: LetterStoryModelElement[] = []

  for (const element of input.template.definition.elements) {
    switch (element.type) {
      case 'text':
        addTextElement(elements, element, input)
        break
      case 'reveal':
        addRevealElement(elements, element, input)
        break
      case 'audio':
        addAudioElement(elements, element, input)
        break
      case 'photo-gallery':
        addPhotoGalleryElement(elements, element, input)
        break
      case 'animation':
        elements.push({
          id: element.id,
          type: 'animation',
          token: element.token,
          trigger: element.trigger,
        })
        break
    }
  }

  return elements
}

export function createLetterStoryModel(
  input: LetterStoryModelInput,
): LetterStoryModel {
  const requiredFields = input.template.definition.fields.flatMap((field) => {
    const resolution = resolveField(field, input.content, input.mediaAssets)

    if (!field.required || resolution.complete) {
      return []
    }

    return [
      {
        fieldId: field.id,
        fieldLabel: field.label,
        message: getRequiredFieldMessage(field),
      },
    ]
  })

  return {
    categoryName: input.template.category.name,
    templateName: input.template.name,
    opening: input.template.definition.openingScreen,
    elements: createElements(input),
    requiredFields,
  }
}
