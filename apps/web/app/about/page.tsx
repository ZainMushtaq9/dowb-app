import { LegalPage } from "@/components/LegalPage";

export const metadata = {
  title: "About",
  description: "About the TikTok Downloader public utility platform."
};

export default function AboutPage() {
  return (
    <LegalPage title="About" updated="May 22, 2026">
      <p>TikTok Downloader is a public utility for processing public TikTok video and profile links without login or accounts.</p>
      <p>The platform is designed around lightweight pages, queue-based downloads, and mobile-friendly performance.</p>
    </LegalPage>
  );
}
