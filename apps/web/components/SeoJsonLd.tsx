export function SeoJsonLd() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        name: "TikTok Downloader",
        url: base,
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Web, Android, iOS",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }
      },
      {
        "@type": "WebSite",
        name: "TikTok Downloader",
        url: base,
        potentialAction: {
          "@type": "SearchAction",
          target: `${base}/?q={search_term_string}`,
          "query-input": "required name=search_term_string"
        }
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "Does this downloader require login?",
            acceptedAnswer: { "@type": "Answer", text: "No. It is designed for public TikTok links only and does not use user accounts." }
          },
          {
            "@type": "Question",
            name: "Can profile downloads run as a queue?",
            acceptedAnswer: { "@type": "Answer", text: "Yes. Selected public videos are processed sequentially with pause, resume, retry, and skip controls." }
          }
        ]
      }
    ]
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
