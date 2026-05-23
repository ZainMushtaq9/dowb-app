import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";
  return [
    "",
    "/video-downloader",
    "/profile-downloader",
    "/download-tiktok-no-watermark",
    "/tiktok-mp3-downloader",
    "/tiktok-profile-downloader",
    "/trending-tiktok-hashtags",
    "/tiktok-caption-generator",
    "/bio-generator",
    "/trending-sounds",
    "/trending",
    "/blog",
    "/hashtag-generator",
    "/caption-generator",
    "/about",
    "/contact",
    "/privacy",
    "/terms",
    "/dmca",
    "/disclaimer",
    "/site-map"
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.8
  }));
}
