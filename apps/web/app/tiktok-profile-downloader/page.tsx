import { CreatorLandingPage } from "@/components/CreatorLandingPage";

export const metadata = {
  title: "TikTok Profile Downloader",
  description: "Download public TikTok profile videos with virtualized rendering and sequential queue controls."
};

export default function TikTokProfileDownloaderPage() {
  return (
    <CreatorLandingPage
      title="TikTok Profile Downloader"
      description="Load public profile videos in a smooth virtualized grid, select what you need, and run a one-by-one download queue."
      primaryHref="/profile-downloader"
      primaryLabel="Open Profile Downloader"
      points={["Handles large public profiles", "No ZIP archives", "Pause, resume, retry, skip, and clear controls"]}
      related={[
        { label: "Video Downloader", href: "/video-downloader" },
        { label: "Hashtag Generator", href: "/hashtag-generator" },
        { label: "Legal Pages", href: "/site-map" }
      ]}
    />
  );
}
