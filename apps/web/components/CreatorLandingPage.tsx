import { AdSlot } from "./AdSlot";

type LinkItem = { label: string; href: string };

export interface CreatorLandingPageProps {
  title: string;
  description: string;
  primaryHref: string;
  primaryLabel: string;
  points: string[];
  related: LinkItem[];
}

export function CreatorLandingPage({ title, description, primaryHref, primaryLabel, points, related }: CreatorLandingPageProps) {
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal sm:text-5xl">{title}</h1>
          <p className="mt-4 max-w-2xl text-base text-black/65 dark:text-white/65">{description}</p>
          <a href={primaryHref} className="mt-6 inline-flex h-12 items-center rounded bg-coral px-5 font-semibold text-white shadow-soft">
            {primaryLabel}
          </a>
        </div>
        <div className="rounded-lg border border-black/10 bg-white p-4 shadow-soft dark:border-white/10 dark:bg-white/5">
          <h2 className="text-lg font-semibold">Built For Fast Creator Workflows</h2>
          <ul className="mt-3 space-y-2 text-sm text-black/65 dark:text-white/65">
            {points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </div>
      </section>

      <AdSlot slot="1234567890" className="my-8" />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {related.map((item) => (
          <a key={item.href} href={item.href} className="rounded-lg border border-black/10 bg-white p-4 shadow-soft dark:border-white/10 dark:bg-white/5">
            <h2 className="font-semibold">{item.label}</h2>
            <p className="mt-2 text-sm text-black/60 dark:text-white/60">Open the lightweight tool and continue without login.</p>
          </a>
        ))}
      </section>
    </main>
  );
}
