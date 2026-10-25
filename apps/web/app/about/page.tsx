import type { Metadata } from "next";
import Link from "next/link";
import { Finale } from "../_components/Finale";
import { Nav } from "../_components/Nav";
import { SectionBand } from "../_components/SectionBand";
import { PageGrid, SiteFrame } from "../_components/SiteFrame";
import BlurText from "../_components/ui/BlurText";

export const metadata: Metadata = {
  title: "About Postdiff: a local-first commit-to-post tool",
  description:
    "Learn why Postdiff exists, how it protects developer control, and what the local-first workflow is designed to do.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <SiteFrame>
      <Nav />
      <main id="main">
        <SectionBand label="About" />
        <section className="bg-surface">
          <PageGrid className="bg-surface">
            <div className="max-w-[820px] px-6 py-24 lg:px-[91px]">
              <p className="eyebrow text-volt">The product</p>
              <BlurText
                as="h1"
                text="Postdiff keeps the building in public part close to the code."
                className="mt-4 max-w-[720px] text-balance text-[40px] font-normal leading-[44px] text-white"
              />
              <div className="mt-8 space-y-5 font-sans text-base font-light leading-7 text-white/65">
                <p>
                  Postdiff is a local-first command-line tool for developers who want to share meaningful work without turning every commit into a writing session. It reads the finished change, decides whether the change is worth talking about, and drafts a post in the voice you teach it. The result is a starting point you can inspect and edit, not an autonomous publishing bot.
                </p>
                <p>
                  The product is intentionally small and explicit. You run the command from the repository where you work, choose the format you need, review the draft, and copy it to the clipboard. Your provider keys, voice samples, reference posts, preferences, drafts, and review history remain in your local Postdiff directory. There are no platform logins, no OAuth connection, and no background publisher.
                </p>
                <p>
                  Postdiff exists for the quiet gap between shipping useful work and explaining why it matters. It is best for indie developers, solo builders, and small teams who want a repeatable build-in-public habit while keeping the final judgment human. Read the <Link href="/docs" className="text-volt underline underline-offset-4">documentation</Link> for the workflow or <Link href="/contact" className="text-volt underline underline-offset-4">contact us</Link> with questions.
                </p>
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
