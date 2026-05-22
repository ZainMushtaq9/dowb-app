export const metadata = {
  title: "TikTok Caption Generator",
  description: "Generate concise TikTok caption ideas for public video posts."
};

export default function CaptionGeneratorPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-semibold">Caption Generator</h1>
      <textarea className="mt-5 min-h-32 w-full rounded border border-black/10 p-3" placeholder="Describe your video" />
      <div className="mt-4 rounded-lg border border-black/10 bg-white p-4 shadow-soft">New idea, clean edit, watch till the end.</div>
    </main>
  );
}
