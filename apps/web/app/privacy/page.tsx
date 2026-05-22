import { LegalPage } from "@/components/LegalPage";

export const metadata = {
  title: "Privacy Policy",
  description: "Privacy policy for TikTok Downloader."
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="May 22, 2026">
      <p>We do not require login, user accounts, or Firebase Auth. The service processes public URLs submitted by users.</p>
      <p>We may collect technical metrics such as page performance, API latency, download success, crash reports, and abuse-prevention signals.</p>
      <p>Advertising partners such as Google AdSense or AdMob may use cookies or device identifiers according to their own policies.</p>
    </LegalPage>
  );
}
