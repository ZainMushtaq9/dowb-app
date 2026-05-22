export const metadata = {
  title: "TikTok Tips Blog",
  description: "Short practical TikTok tips for saving, organizing, and improving public video workflows."
};

export default function BlogPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-semibold">TikTok Tips</h1>
      <article className="mt-5 rounded-lg border border-black/10 bg-white p-5 shadow-soft">
        <h2 className="text-xl font-semibold">How to download public TikTok videos safely</h2>
        <p className="mt-2 text-black/65">
          Use public URLs only, avoid account credentials, and download in small batches when working with large profiles.
        </p>
      </article>
    </main>
  );
}
