import type { ReactNode } from 'react'

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <section className="w-full max-w-lg rounded-[2rem] border border-white/80 bg-white/80 p-8 shadow-[0_2rem_6rem_rgb(122_83_110/0.14)] backdrop-blur sm:p-12">
        <p className="text-sm uppercase tracking-[0.3em] text-[var(--dearly-plum)]">
          {eyebrow}
        </p>
        <h1 className="mt-5 text-4xl leading-tight tracking-tight sm:text-5xl">
          {title}
        </h1>
        <p className="mt-5 leading-7 text-[var(--dearly-muted)]">
          {description}
        </p>
        <div className="mt-8">{children}</div>
      </section>
    </main>
  )
}
