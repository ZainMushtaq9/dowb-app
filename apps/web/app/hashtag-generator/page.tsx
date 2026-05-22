export const metadata = {
  title: "TikTok Hashtag Generator",
  description: "Create lightweight TikTok hashtag ideas for public content planning."
};

export default function HashtagGeneratorPage() {
  return <Tool title="Hashtag Generator" placeholder="video topic, niche, or audience" prefix="#" />;
}

function Tool({ title, placeholder, prefix }: { title: string; placeholder: string; prefix: string }) {
  const items = ["viral", "creator", "tips", "shorts", "trend", "daily"];
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-semibold">{title}</h1>
      <input className="mt-5 h-12 w-full rounded border border-black/10 px-3" placeholder={placeholder} />
      <div className="mt-4 flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="rounded bg-ink px-3 py-2 text-sm text-white">
            {prefix}
            {item}
          </span>
        ))}
      </div>
    </main>
  );
}
