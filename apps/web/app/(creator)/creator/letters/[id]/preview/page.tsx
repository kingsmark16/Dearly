import { CreatorLetterPreview } from '../../../../../../src/features/letters/components/creator-letter-preview'

export default async function CreatorLetterPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return <CreatorLetterPreview letterId={id} />
}
