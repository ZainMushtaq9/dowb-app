import { CreatorLandingPage } from "@/components/CreatorLandingPage";

export const metadata = {
  title: "TikTok MP3 Downloader",
  description: "Plan audio extraction workflows for public TikTok links with a lightweight creator utility stack."
};

export default function TikTokMp3DownloaderPage() {
  return (
    <CreatorLandingPage
      title="TikTok MP3 Downloader"
      description="A search-focused creator landing page for TikTok audio workflows. Route users into the public downloader while keeping audio features remotely controllable."
      primaryHref="/video-downloader"
      primaryLabel="Paste TikTok URL"
      points={["Designed for future audio extraction", "Remote feature flags", "AdSense-ready page layout"]}
      related={[
        { label: "No Watermark Downloader", href: "/download-tiktok-no-watermark" },
        { label: "Trending Sounds", href: "/trending-sounds" },
        { label: "Creator Tips", href: "/blog" }
      ]}
    />
  );
}
