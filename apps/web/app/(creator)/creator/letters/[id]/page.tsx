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
      eyebrow="Letter workspace"
      title="Make it yours."
      description="Your Letter is automatically saved. Published changes stay private until you publish the updates."
    >
      <DraftEditor letterId={id} />
    </AuthShell>
  )
}
