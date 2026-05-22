import { LegalPage } from "@/components/LegalPage";

export const metadata = {
  title: "Terms of Service",
  description: "Terms of service for TikTok Downloader."
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="May 22, 2026">
      <p>Use this service only for public content and only where you have the rights or permission to download or reuse that content.</p>
      <p>You agree not to overload the service, bypass limits, or use it for illegal, abusive, or copyright-infringing activity.</p>
      <p>The service is provided as-is and may be limited, changed, interrupted, or discontinued.</p>
    </LegalPage>
  );
}
