import Link from "next/link";
import { Finale } from "./_components/Finale";
import { Nav } from "./_components/Nav";
import { PageGrid, SiteFrame } from "./_components/SiteFrame";
import BlurText from "./_components/ui/BlurText";

export default function NotFound() {
  return (
    <SiteFrame>
      <Nav />
      <main id="main" className="bg-surface">
        <PageGrid className="bg-surface">
          <div className="flex flex-col items-start gap-6 px-6 py-32 lg:px-[91px]">
            <p className="eyebrow text-volt">Lost pages</p>
            <BlurText
              as="h1"
              text="This page went quiet, like a routine update"
              className="max-w-[640px] text-balance text-[40px] font-normal leading-[44px] text-white"
            />
            <p className="max-w-[520px] font-sans text-base font-light leading-[26px] text-white/60">
              The link you followed does not exist. The good stuff is still one
              click away.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/"
                className="btn-primary px-4 py-3.5 font-sans text-base font-medium"
              >
                Back to home
              </Link>
              <Link
                href="/pricing"
                className="btn-ghost px-4 py-3.5 font-sans text-base"
              >
                See pricing
              </Link>
            </div>
            <p className="font-mono text-xs text-white/30">
              Error 404: page not found
            </p>
          </div>
          <div className="hairline" />
        </PageGrid>
      </main>
      <Finale />
    </SiteFrame>
  );
}
