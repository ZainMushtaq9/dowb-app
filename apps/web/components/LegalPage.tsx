export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-semibold">{title}</h1>
      <p className="mt-2 text-sm text-black/55 dark:text-white/55">Last updated: {updated}</p>
      <div className="mt-6 space-y-4 leading-7 text-black/75 dark:text-white/75">{children}</div>
    </main>
  );
}
