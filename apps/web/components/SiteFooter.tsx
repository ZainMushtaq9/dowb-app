import { AdSlot } from "./AdSlot";

const tools = [
  ["Video Downloader", "/video-downloader"],
  ["Profile Downloader", "/profile-downloader"],
  ["Trending Tools", "/trending"],
  ["TikTok Tips", "/blog"],
  ["Hashtag Generator", "/hashtag-generator"],
  ["Caption Generator", "/caption-generator"]
];

const legal = [
  ["About", "/about"],
  ["Contact", "/contact"],
  ["Privacy", "/privacy"],
  ["Terms", "/terms"],
  ["DMCA", "/dmca"],
  ["Disclaimer", "/disclaimer"],
  ["Sitemap", "/site-map"]
];

export function SiteFooter() {
  return (
    <footer className="mx-auto w-full max-w-6xl px-4 pb-8 sm:px-6 lg:px-8">
      <AdSlot slot="1234567890" className="my-6" />
      <div className="grid gap-6 border-t border-black/10 pt-6 text-sm dark:border-white/10 sm:grid-cols-3">
        <div>
          <div className="font-semibold">TikTok Downloader</div>
          <p className="mt-2 text-black/60 dark:text-white/60">Public video tools, profile queues, and lightweight mobile-first downloads.</p>
        </div>
        <nav aria-label="Tools" className="flex flex-col gap-2">
          <div className="font-semibold">Tools</div>
          {tools.map(([label, href]) => (
            <a key={href} href={href} className="text-black/65 hover:text-black dark:text-white/65 dark:hover:text-white">
              {label}
            </a>
          ))}
        </nav>
        <nav aria-label="Legal" className="flex flex-col gap-2">
          <div className="font-semibold">Legal</div>
          {legal.map(([label, href]) => (
            <a key={href} href={href} className="text-black/65 hover:text-black dark:text-white/65 dark:hover:text-white">
              {label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
