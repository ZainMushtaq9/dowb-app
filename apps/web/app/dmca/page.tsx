import { LegalPage } from "@/components/LegalPage";

export const metadata = {
  title: "DMCA",
  description: "DMCA and copyright removal information for TikTok Downloader."
};

export default function DmcaPage() {
  return (
    <LegalPage title="DMCA" updated="May 22, 2026">
      <p>The service does not permanently store downloaded videos. It processes public links and temporary download responses.</p>
      <p>If you believe content is being misused, send a copyright notice with the public URL, ownership information, and contact details.</p>
      <p>Valid notices will be reviewed and abusive access may be blocked.</p>
    </LegalPage>
  );
}
