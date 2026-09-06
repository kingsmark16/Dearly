export type CatalogTextContent =
  { kind: 'static'; value: string } | { kind: 'field'; fieldId: string }

export type CatalogTemplateElement =
  | {
      id: string
      type: 'text'
      heading: string
      body: CatalogTextContent
    }
  | {
      id: string
      type: 'reveal'
      heading: string
      prompt: string
      body: CatalogTextContent
    }
  | {
      id: string
      type: 'audio'
      fieldId: string
      label: string
    }
  | {
      id: string
      type: 'photo-gallery'
      fieldId: string
      heading: string
    }
  | {
      id: string
      type: 'animation'
      token: 'hearts' | 'sparkles' | 'petals' | 'confetti'
      trigger: 'on-open' | 'on-scroll'
    }
