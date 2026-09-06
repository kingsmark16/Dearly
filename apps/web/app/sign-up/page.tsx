import { AuthShell } from '../../src/components/auth-shell'
import { SignUpForm } from '../../src/components/sign-up-form'

export default function SignUpPage() {
  return (
    <AuthShell
      eyebrow="Dearly Creator"
      title="Make something worth keeping."
      description="Create a free Creator account. We will verify your email before giving you access to the letter workspace."
    >
      <SignUpForm />
    </AuthShell>
  )
}
