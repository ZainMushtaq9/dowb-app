export const metadata = {
  title: "TikTok Bio Generator",
  description: "Create short TikTok bio ideas for creator profiles."
};

export default function BioGeneratorPage() {
  const examples = ["Daily ideas, clean edits, fresh stories.", "Helping creators post smarter every week.", "Short videos, useful tips, real momentum."];
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-semibold">Bio Generator</h1>
      <input className="mt-5 h-12 w-full rounded border border-black/10 px-3" placeholder="Your niche or creator style" />
      <div className="mt-4 grid gap-3">
        {examples.map((example) => (
          <div key={example} className="rounded-lg border border-black/10 bg-white p-4 shadow-soft dark:border-white/10 dark:bg-white/5">
            {example}
          </div>
        ))}
      </div>
    </main>
  );
}
