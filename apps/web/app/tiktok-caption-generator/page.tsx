import { CreatorLandingPage } from "@/components/CreatorLandingPage";

export const metadata = {
  title: "TikTok Caption Generator",
  description: "Generate TikTok captions and route creator traffic through SEO-friendly utility pages."
};

export default function TikTokCaptionGeneratorLandingPage() {
  return (
    <CreatorLandingPage
      title="TikTok Caption Generator"
      description="Create short caption ideas for public TikTok posts and keep visitors inside the creator toolkit."
      primaryHref="/caption-generator"
      primaryLabel="Generate Captions"
      points={["Fast static SEO route", "Internal links to downloader tools", "Lightweight mobile-first layout"]}
      related={[
        { label: "Trending Hashtags", href: "/trending-tiktok-hashtags" },
        { label: "Bio Generator", href: "/bio-generator" },
        { label: "Creator Tips Blog", href: "/blog" }
      ]}
    />
  );
}
