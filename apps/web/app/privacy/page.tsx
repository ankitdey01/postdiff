import type { Metadata } from "next";
import { Finale } from "../_components/Finale";
import { Nav } from "../_components/Nav";
import { Reveal } from "../_components/Reveal";
import { SectionBand } from "../_components/SectionBand";
import { PageGrid, SiteFrame } from "../_components/SiteFrame";
import { RailToc } from "../_components/ui/rail-toc";
import BlurText from "../_components/ui/BlurText";

export const metadata: Metadata = {
  title: "Privacy: your work stays on your machine",
  description:
    "Postdiff runs locally. Your writing samples and drafts stay on your machine. Only the text needed for a draft is sent to your AI provider.",
  alternates: { canonical: "/privacy" },
};

const SECTIONS = [
  {
    title: "What stays on your machine",
    body: "Your writing samples, reference posts, taste rules, drafts, and approvals live as plain files on your own computer. We never see them, store them, or back them up. Deleting the folder removes them for good.",
  },
  {
    title: "What is sent, and when",
    body: "When you ask for a draft, the text needed to write it is sent to the AI provider you picked during setup. That usually means what changed, why it matters, and your writing samples. Nothing is sent until you run the command.",
  },
  {
    title: "What we never collect",
    body: "This site has no accounts, no analytics cookies, and no tracking pixels. We do not build profiles, sell data, or keep copies of your drafts. Your provider may keep its own logs, and its policy applies to those calls.",
  },
  {
    title: "Your keys",
    body: "API keys live in a private file on your machine, separate from your settings. They are never written into shared config files and never leave your machine except when calling the provider you chose.",
  },
  {
    title: "Questions",
    body: "If anything here is unclear, open an issue on the public repo and we will answer it there so everyone can see the answer.",
  },
];

export default function PrivacyPage() {
  return (
    <SiteFrame>
      <Nav />
      <main id="main">
        <SectionBand label="Privacy" />
        <section className="bg-surface">
          <PageGrid className="bg-surface">
            <div className="document-with-rail grid lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="px-6 py-24 lg:px-[91px]">
                <Reveal motion="fade">
                  <p className="eyebrow text-volt">Privacy</p>
                  <BlurText
                    as="h1"
                    text="Your work stays on your machine"
                    className="mt-4 max-w-[640px] text-balance text-[40px] font-normal leading-[44px] text-white"
                  />
                </Reveal>
                <Reveal delay={100}>
                  <p className="mt-4 max-w-[576px] font-sans text-base font-light leading-[26px] text-white/60">
                    Postdiff runs locally and has no accounts. The short version:
                    we cannot see your drafts because they never reach us. Last
                    updated October 2026.
                  </p>
                </Reveal>
                <div className="mt-12 flex max-w-[720px] flex-col gap-px border border-line bg-line">
                  {SECTIONS.map((s, i) => (
                    <Reveal
                      key={s.title}
                      id={[
                        "local-files",
                        "provider-calls",
                        "data-collection",
                        "api-keys",
                        "questions",
                      ][i]}
                      as="article"
                      delay={Math.min(i, 2) * 50}
                      className="scroll-mt-8 bg-surface p-6"
                    >
                      <h2 className="font-sans text-xl text-white">{s.title}</h2>
                      <p className="mt-2 font-sans text-[15px] font-light leading-7 text-white/60">
                        {s.body}
                      </p>
                    </Reveal>
                  ))}
                </div>
              </div>
              <div className="lg:col-start-2 lg:row-start-1">
                <aside className="border-t border-line bg-black/20 px-6 py-8 lg:sticky lg:top-8 lg:border-t-0 lg:px-7 lg:py-10">
                  <RailToc
                    className="w-full"
                    title="On this page"
                    items={[
                      { id: "local-files", label: "On your machine" },
                      { id: "provider-calls", label: "What is sent" },
                      { id: "data-collection", label: "What we never collect" },
                      { id: "api-keys", label: "Your keys" },
                      { id: "questions", label: "Questions" },
                    ]}
                  />
                  <div className="mt-10 border-t border-line pt-5">
                    <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/35">
                      At a glance
                    </p>
                    <ul className="mt-5 flex flex-col gap-4 font-mono text-xs uppercase tracking-[0.12em] text-white/55">
                      <li>Local profile files</li>
                      <li>Provider calls on demand</li>
                      <li>No accounts or trackers</li>
                    </ul>
                  </div>
                  <div className="mt-10 border-t border-line pt-5">
                    <p className="font-sans text-sm font-light leading-6 text-white/60">
                      Delete the local Postdiff directory to remove your stored
                      samples, drafts, and review history.
                    </p>
                  </div>
                </aside>
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
