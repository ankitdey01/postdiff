import type { Metadata } from "next";
import { CopyCommand } from "../_components/CopyCommand";
import { Finale } from "../_components/Finale";
import { Nav } from "../_components/Nav";
import { Reveal } from "../_components/Reveal";
import { SectionBand } from "../_components/SectionBand";
import { PageGrid, SiteFrame } from "../_components/SiteFrame";
import BlurText from "../_components/ui/BlurText";

export const metadata: Metadata = {
  title: "Pricing: free while it runs on your keys",
  description:
    "Postdiff is free to use. You only pay whatever your AI provider charges, usually a few cents per draft.",
  alternates: { canonical: "/pricing" },
};

const INCLUDED = [
  {
    title: "Drafts for three places",
    body: "Short posts, longer posts, and full blog drafts from the same finished work.",
  },
  {
    title: "Your voice included",
    body: "Every draft follows samples of your own writing, so it sounds like you.",
  },
  {
    title: "Skips the boring stuff",
    body: "Routine updates stay quiet. Only work worth sharing becomes a draft.",
  },
  {
    title: "You approve everything",
    body: "Nothing posts itself. Every draft waits for your okay first.",
  },
  {
    title: "Use your own provider",
    body: "Connect the AI provider you already pay for and switch any time.",
  },
  {
    title: "Private by default",
    body: "Samples and drafts live on your machine as plain files you control.",
  },
];

export default function PricingPage() {
  return (
    <SiteFrame>
      <Nav />
      <main id="main">
        <SectionBand label="Pricing" />
        <section className="bg-surface">
          <PageGrid className="bg-surface">
            <div className="px-6 py-24 lg:px-[91px]">
              <Reveal motion="fade">
                <p className="eyebrow text-volt">Pricing</p>
                <BlurText
                  as="h1"
                  text="Free to use, pennies per draft"
                  className="mt-4 max-w-[640px] text-balance text-[40px] font-normal leading-[44px] text-white"
                />
              </Reveal>
              <Reveal delay={100}>
                <p className="mt-4 max-w-[576px] font-sans text-base font-light leading-[26px] text-white/60">
                  Postdiff itself costs nothing right now. It runs on your own
                  AI provider key, so you only pay what your provider charges.
                  Most drafts cost a few cents.
                </p>
              </Reveal>

              <div className="mt-12 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1fr]">
                <Reveal>
                  <div className="flex h-full flex-col border border-lime/40 bg-panel p-8">
                    <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-volt">
                      Current plan
                    </p>
                    <p className="mt-4 font-sans text-2xl text-white">Free</p>
                    <p className="mt-2 font-sans text-base font-light leading-6 text-white/60">
                      Everything included. Bring your own provider key and post
                      as often as you like.
                    </p>
                    <ul className="mt-6 flex flex-col gap-3 font-sans text-[15px] font-light leading-6 text-white/70">
                      <li>Unlimited drafts on your machine</li>
                      <li>All three post types</li>
                      <li>Voice samples and taste rules included</li>
                      <li>No seats, no subscriptions, no lock in</li>
                    </ul>
                    <CopyCommand command="npm i -g postdiff" className="mt-8 self-start" />
                  </div>
                </Reveal>
                <Reveal delay={100}>
                  <div className="flex h-full flex-col border border-line bg-panel p-8">
                    <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/40">
                      What you pay elsewhere
                    </p>
                    <p className="mt-4 font-sans text-2xl text-white">
                      Your provider bill
                    </p>
                    <p className="mt-2 font-sans text-base font-light leading-6 text-white/60">
                      Each draft makes one or two small calls to the provider
                      you picked during setup. Nothing goes through our servers.
                    </p>
                    <ul className="mt-6 flex flex-col gap-3 font-sans text-[15px] font-light leading-6 text-white/70">
                      <li>Usually a few cents per draft</li>
                      <li>You see the usage in your own provider dashboard</li>
                      <li>Stop any time by removing your key</li>
                    </ul>
                  </div>
                </Reveal>
              </div>
            </div>
            <div className="hairline" />
          </PageGrid>
        </section>

        <SectionBand label="Included" />
        <section className="bg-surface">
          <PageGrid className="bg-surface">
            <div className="px-6 py-24 lg:px-[91px]">
              <div className="grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
                {INCLUDED.map((f, i) => (
                  <Reveal
                    key={f.title}
                    as="article"
                    delay={(i % 3) * 100}
                    className="bg-surface p-6"
                  >
                    <h2 className="font-sans text-2xl text-white">{f.title}</h2>
                    <p className="mt-2 font-sans text-base font-light leading-[26px] text-white/60">
                      {f.body}
                    </p>
                  </Reveal>
                ))}
              </div>
            </div>
            <div className="hairline" />
          </PageGrid>
        </section>
      </main>
      <Finale />
    </SiteFrame>
  );
}
