import { CreatorLandingPage } from "@/components/CreatorLandingPage";

export const metadata = {
  title: "Trending TikTok Sounds",
  description: "Plan TikTok content around trending sounds and creator growth utilities."
};

export default function TrendingSoundsPage() {
  return (
    <CreatorLandingPage
      title="Trending TikTok Sounds"
      description="A lightweight SEO route for sound research, connected to downloader and creator planning tools."
      primaryHref="/trending"
      primaryLabel="Explore Trending Tools"
      points={["SEO route for creator discovery", "Ready for remote feature enablement", "Links into caption and hashtag flows"]}
      related={[
        { label: "TikTok MP3 Downloader", href: "/tiktok-mp3-downloader" },
        { label: "Caption Generator", href: "/caption-generator" },
        { label: "Hashtag Generator", href: "/hashtag-generator" }
      ]}
    />
  );
}
