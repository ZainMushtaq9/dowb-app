import { DownloaderApp } from "@/components/DownloaderApp";

export const metadata = {
  title: "TikTok Profile Downloader",
  description: "Download public TikTok profile videos with virtualized selection and sequential queue downloading."
};

export default function ProfileDownloaderPage() {
  return <DownloaderApp />;
}
