import { LegalPage } from "@/components/LegalPage";

export const metadata = {
  title: "Disclaimer",
  description: "Disclaimer for TikTok Downloader."
};

export default function DisclaimerPage() {
  return (
    <LegalPage title="Disclaimer" updated="May 22, 2026">
      <p>This platform is not affiliated with TikTok, ByteDance, or any social media platform.</p>
      <p>All trademarks belong to their respective owners. Users are responsible for following platform rules and applicable laws.</p>
    </LegalPage>
  );
}
