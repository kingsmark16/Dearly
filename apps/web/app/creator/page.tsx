import { AuthShell } from '../../src/components/auth-shell'
import { CreatorArea } from '../../src/components/creator-area'

export default function CreatorPage() {
  return (
    <AuthShell
      eyebrow="Creator area"
      title="A quiet place to begin."
      description="Only a verified Creator can enter this workspace."
    >
      <CreatorArea />
    </AuthShell>
  )
}
