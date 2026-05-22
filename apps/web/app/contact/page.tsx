import { LegalPage } from "@/components/LegalPage";

export const metadata = {
  title: "Contact",
  description: "Contact TikTok Downloader support."
};

export default function ContactPage() {
  return (
    <LegalPage title="Contact" updated="May 22, 2026">
      <p>For support, copyright, abuse, partnership, or advertising questions, contact the site operator at your published support email.</p>
      <p>Before requesting help, include the public URL, browser or device, and the approximate time of the issue.</p>
    </LegalPage>
  );
}
