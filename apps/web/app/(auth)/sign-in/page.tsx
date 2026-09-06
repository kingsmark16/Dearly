import { AuthShell } from '../../../src/features/auth/components/auth-shell'
import { SignInForm } from '../../../src/features/auth/components/sign-in-form'

export default function SignInPage() {
  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Your words are waiting."
      description="Sign in with your verified Creator account to enter your private workspace."
    >
      <SignInForm />
    </AuthShell>
  )
}
