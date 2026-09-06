export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-6 text-center">
      <p className="text-sm uppercase tracking-[0.3em] text-[var(--dearly-plum)]">
        Dearly
      </p>
      <h1 className="mt-4 text-4xl">This letter is not available.</h1>
      <p className="mt-4 text-[var(--dearly-muted)]">
        The link may be incorrect, archived, or no longer active.
      </p>
    </main>
  )
}
