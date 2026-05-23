export const metadata = {
  title: "Site Map",
  description: "Browse TikTok Downloader pages, tools, and legal links."
};

const links = [
  ["Home", "/"],
  ["Video Downloader", "/video-downloader"],
  ["Profile Downloader", "/profile-downloader"],
  ["Download TikTok No Watermark", "/download-tiktok-no-watermark"],
  ["TikTok MP3 Downloader", "/tiktok-mp3-downloader"],
  ["TikTok Profile Downloader", "/tiktok-profile-downloader"],
  ["Trending TikTok Hashtags", "/trending-tiktok-hashtags"],
  ["TikTok Caption Generator", "/tiktok-caption-generator"],
  ["Bio Generator", "/bio-generator"],
  ["Trending Sounds", "/trending-sounds"],
  ["Trending Tools", "/trending"],
  ["Blog", "/blog"],
  ["Hashtag Generator", "/hashtag-generator"],
  ["Caption Generator", "/caption-generator"],
  ["About", "/about"],
  ["Contact", "/contact"],
  ["Privacy", "/privacy"],
  ["Terms", "/terms"],
  ["DMCA", "/dmca"],
  ["Disclaimer", "/disclaimer"]
];

export default function SiteMapPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-semibold">Site Map</h1>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {links.map(([label, href]) => (
          <a key={href} href={href} className="rounded-lg border border-black/10 bg-white p-4 shadow-soft dark:border-white/10 dark:bg-white/5">
            {label}
          </a>
        ))}
      </div>
    </main>
  );
}
