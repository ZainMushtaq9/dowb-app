import { CreatorLandingPage } from "@/components/CreatorLandingPage";

export const metadata = {
  title: "Trending TikTok Hashtags",
  description: "Explore TikTok hashtag ideas and route creators into lightweight growth tools."
};

export default function TrendingTikTokHashtagsPage() {
  return (
    <CreatorLandingPage
      title="Trending TikTok Hashtags"
      description="Find practical hashtag ideas for public creator workflows and connect users to downloader, caption, and bio tools."
      primaryHref="/hashtag-generator"
      primaryLabel="Generate Hashtags"
      points={["SEO landing page for hashtag searches", "Internal links for topic clusters", "AdSense-ready content area"]}
      related={[
        { label: "Caption Generator", href: "/caption-generator" },
        { label: "Bio Generator", href: "/bio-generator" },
        { label: "Trending Tools", href: "/trending" }
      ]}
    />
  );
}
