import type { Metadata } from "next";
import Link from "next/link";
import { Finale } from "../_components/Finale";
import { Nav } from "../_components/Nav";
import { SectionBand } from "../_components/SectionBand";
import { PageGrid, SiteFrame } from "../_components/SiteFrame";
import BlurText from "../_components/ui/BlurText";

export const metadata: Metadata = {
  title: "Contact Postdiff",
  description:
    "Contact the Postdiff maintainer for product questions, accessibility feedback, bugs, and partnership ideas.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <SiteFrame>
      <Nav />
      <main id="main">
        <SectionBand label="Contact" />
        <section className="bg-surface">
          <PageGrid className="bg-surface">
            <div className="max-w-[820px] px-6 py-24 lg:px-[91px]">
              <p className="eyebrow text-volt">Talk to us</p>
              <BlurText
                as="h1"
                text="Questions, bugs, or a better way to build in public?"
                className="mt-4 max-w-[720px] text-balance text-[40px] font-normal leading-[44px] text-white"
              />
              <div className="mt-8 space-y-5 font-sans text-base font-light leading-7 text-white/65">
                <p>
                  Email the Postdiff maintainer at <a href="mailto:ankitdey450@gmail.com" className="text-volt underline underline-offset-4">ankitdey450@gmail.com</a>. This is the best route for product questions, a reproducible bug report, accessibility feedback, documentation corrections, or a thoughtful idea about the local-first workflow.
                </p>
                <p>
                  For technical issues, include the command you ran, the operating system, the Postdiff version, and a small redacted reproduction. Never send API keys, private repository contents, voice samples, or unpublished drafts in an email or issue. Postdiff is designed so those files stay on your machine; support does not need them to investigate a normal CLI problem.
                </p>
                <p>
                  You can also open a public issue in the <a href="https://github.com/ankitdey01/postdiff/issues" className="text-volt underline underline-offset-4">GitHub repository</a>. Before reporting a question already covered by the <Link href="/docs" className="text-volt underline underline-offset-4">docs</Link>, check the command examples and privacy model. We read every report, but response time may vary because Postdiff is an actively developed pre-release project.
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
