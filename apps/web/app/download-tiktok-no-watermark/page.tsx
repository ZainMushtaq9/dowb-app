import { CreatorLandingPage } from "@/components/CreatorLandingPage";

export const metadata = {
  title: "Download TikTok Videos Without Watermark",
  description: "Download public TikTok videos with a lightweight queue, real thumbnails, and mobile-friendly controls."
};

export default function DownloadTikTokNoWatermarkPage() {
  return (
    <CreatorLandingPage
      title="Download TikTok Videos Without Watermark"
      description="Paste a public TikTok video or profile URL and use the downloader queue as a fast traffic tool inside the creator toolkit."
      primaryHref="/video-downloader"
      primaryLabel="Open Video Downloader"
      points={["No login or account required", "Sequential downloads with retries", "Real thumbnail metadata when TikTok allows access"]}
      related={[
        { label: "Profile Downloader", href: "/profile-downloader" },
        { label: "Caption Generator", href: "/caption-generator" },
        { label: "Trending Hashtags", href: "/trending-tiktok-hashtags" }
      ]}
    />
  );
}
