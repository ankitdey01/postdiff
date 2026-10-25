import type { Metadata } from "next";
import { Finale } from "../_components/Finale";
import { Nav } from "../_components/Nav";
import { Reveal } from "../_components/Reveal";
import { SectionBand } from "../_components/SectionBand";
import { PageGrid, SiteFrame } from "../_components/SiteFrame";
import BlurText from "../_components/ui/BlurText";

export const metadata: Metadata = {
  title: "Terms: simple ground rules",
  description:
    "Simple terms for Postdiff. The tool is provided as is, you own your drafts, and you are responsible for what you post.",
  alternates: { canonical: "/tos" },
};

const SECTIONS = [
  {
    title: "What Postdiff is",
    body: "Postdiff is a command line tool that drafts posts from your finished work. It provides drafts, not finished opinions, and every draft needs your approval before it can be used.",
  },
  {
    title: "You own your words",
    body: "Your writing samples, drafts, and posted content are yours. We claim no rights over them. If a draft quotes someone else, getting permission is on you.",
  },
  {
    title: "You are responsible for what you post",
    body: "Read every draft before you share it. Check facts, quotes, and code. We are not liable if a post contains a mistake, breaks a rule of a platform, or causes any loss.",
  },
  {
    title: "Provided as is",
    body: "The tool is provided as is, without warranties of any kind. It may change, pause, or stop working with a given provider if that provider changes its service. We will note breaking changes in the repo.",
  },
  {
    title: "Fair use",
    body: "Do not misuse the tool to spam people, impersonate others, or break the law. If you do, that is on you, and we may stop supporting your use.",
  },
  {
    title: "Changes to these terms",
    body: "If these terms change, the new version will be posted on this page with a new date. Continued use after a change means you accept the new version.",
  },
];

export default function TosPage() {
  return (
    <SiteFrame>
      <Nav />
      <main id="main">
        <SectionBand label="Terms" />
        <section className="bg-surface">
          <PageGrid className="bg-surface">
            <div className="grid lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="px-6 py-24 lg:px-[91px]">
                <Reveal motion="fade">
                  <p className="eyebrow text-volt">Terms of service</p>
                  <BlurText
                    as="h1"
                    text="Simple ground rules"
                    className="mt-4 max-w-[640px] text-balance text-[40px] font-normal leading-[44px] text-white"
                  />
                </Reveal>
                <Reveal delay={100}>
                  <p className="mt-4 max-w-[576px] font-sans text-base font-light leading-[26px] text-white/60">
                    Plain language, no fine print tricks. Last updated October
                    2026. This is not legal advice, just how we run the project.
                  </p>
                </Reveal>
                <div className="mt-12 flex max-w-[720px] flex-col gap-px border border-line bg-line">
                  {SECTIONS.map((s, i) => (
                    <Reveal key={s.title} as="article" delay={Math.min(i, 2) * 50} className="bg-surface p-6">
                      <h2 className="font-sans text-xl text-white">{s.title}</h2>
                      <p className="mt-2 font-sans text-[15px] font-light leading-7 text-white/60">
                        {s.body}
                      </p>
                    </Reveal>
                  ))}
                </div>
              </div>
              <aside className="border-t border-line bg-black/20 px-6 py-8 lg:border-l lg:border-t-0 lg:px-7 lg:py-10">
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/35">
                  The short version
                </p>
                <ul className="mt-5 flex flex-col gap-4 font-mono text-xs uppercase tracking-[0.12em] text-white/55">
                  <li>You own your drafts</li>
                  <li>You review before posting</li>
                  <li>Use it fairly</li>
                </ul>
                <div className="mt-12 border-t border-line pt-5">
                  <p className="font-sans text-sm font-light leading-6 text-white/60">
                    These terms describe the current pre-release project and
                    will be updated here when that changes.
                  </p>
                </div>
              </aside>
            </div>
            <div className="hairline" />
          </PageGrid>
        </section>
      </main>
      <Finale />
    </SiteFrame>
  );
}
