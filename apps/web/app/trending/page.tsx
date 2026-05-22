export const metadata = {
  title: "Trending TikTok Tools",
  description: "Fast public TikTok utility tools for creators and viewers."
};

export default function TrendingPage() {
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-semibold">Trending Tools</h1>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {["Video Downloader", "Profile Downloader", "Caption Generator"].map((tool) => (
          <a key={tool} href={`/${tool.toLowerCase().replaceAll(" ", "-")}`} className="rounded-lg border border-black/10 bg-white p-4 shadow-soft">
            <h2 className="font-semibold">{tool}</h2>
            <p className="mt-2 text-sm text-black/60">Mobile-first, lightweight, and optimized for slow networks.</p>
          </a>
        ))}
      </div>
    </main>
  );
}
