import { AuthShell } from '../../../../../src/features/auth/components/auth-shell'
import { DraftEditor } from '../../../../../src/features/letters/components/draft-editor'

export default async function CreatorLetterDraftPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <AuthShell
      eyebrow="Letter Draft"
      title="Make it yours."
      description="Your Draft is private, automatically saved, and ready for your words."
    >
      <DraftEditor letterId={id} />
    </AuthShell>
  )
}
