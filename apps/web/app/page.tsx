import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-16 text-center">
      <p className="mb-4 text-sm uppercase tracking-[0.3em] text-[var(--dearly-plum)]">
        Dearly
      </p>
      <h1 className="max-w-xl text-5xl leading-tight tracking-tight sm:text-6xl">
        Letters worth keeping.
      </h1>
      <p className="mt-6 max-w-lg text-lg leading-8 text-[var(--dearly-muted)]">
        Create an interactive letter, then share one quiet link with someone
        special.
      </p>
      <p className="mt-8 text-sm text-[var(--dearly-muted)]">
        Open a shared Dearly link to read a letter made for you.
      </p>
      <div className="mt-10 flex flex-wrap justify-center gap-4">
        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--dearly-plum)] px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110"
          href="/sign-up"
        >
          Create a letter
        </Link>
        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--dearly-plum)] px-6 py-3 text-sm font-semibold text-[var(--dearly-plum)] transition hover:bg-white"
          href="/sign-in"
        >
          Sign in
        </Link>
      </div>
    </main>
  )
}
