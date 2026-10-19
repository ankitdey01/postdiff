import type { CSSProperties } from "react";
import { Reveal } from "./Reveal";
import { SectionBand } from "./SectionBand";
import BlurText from "./ui/BlurText";
import PixelCard from "./ui/PixelCard";

const FEATURES = [
  {
    title: "Knows what to skip",
    body: "Small chores and routine updates stay quiet. Only work worth sharing becomes a draft.",
  },
  {
    title: "Keeps it focused",
    body: "Each draft sticks to the part that matters. The rest stays out of the post.",
  },
  {
    title: "Sounds like you",
    body: "Every draft follows samples of your own writing, so it reads like you on a good day.",
  },
  {
    title: "Learns your taste",
    body: "Your edits and approvals shape future drafts. The more you use it, the closer it gets.",
  },
  {
    title: "One command",
    body: "Run a single command where you already work and get a draft back in seconds.",
  },
  {
    title: "Works with your tools",
    body: "Use it with the AI provider and model you already pay for. Switch any time.",
  },
  {
    title: "You approve everything",
    body: "Nothing goes out without your okay. Every draft is yours to edit, accept, or drop.",
  },
  {
    title: "Post anywhere",
    body: "Copy the finished draft and paste it wherever your readers are. No connections needed.",
  },
  {
    title: "Private by default",
    body: "Your writing samples and drafts live on your own machine. Nothing to revoke.",
  },
] as const;

/** Feature grid: nine cells, one message each. */
export function Features() {
  return (
    <>
      <SectionBand label="Everything" />
      <section id="features" className="bg-surface">
        <div className="mx-auto w-full max-w-[1440px] px-6 py-24 lg:px-[91px]">
          <h2 className="max-w-[640px] text-balance text-[40px] font-normal leading-[44px]">
            <BlurText
              as="span"
              text="Everything handled,"
              className="text-white"
              style={{ display: "inline-flex" }}
            />
            <br />
            <BlurText
              as="span"
              text="from finished work to ready draft."
              className="text-white/60"
              style={{ display: "inline-flex" }}
            />
          </h2>
          <Reveal delay={100}>
            <p className="mt-4 font-sans text-base font-light leading-[26px] text-white/60">
              The full path from your latest work to a post you are happy to share,{" "}
              <span className="text-white">without leaving your terminal.</span>
            </p>
          </Reveal>
          <div className="mt-10 grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} as="article" delay={(i % 3) * 100} className="bg-surface">
                <PixelCard
                  theme="dark"
                  variant="default"
                  noFocus
                  radius={0}
                  trigger="hover"
                  glow={0.2}
                  spotlight={0.25}
                  opacity={0.2}
                  fade={0.15}
                  pixelSize={1.5}
                  gap={4}
                  speed={25}
                  className="h-full min-h-[180px] w-full p-6"
                  style={
                    {
                      "--pixel-card-surface": "var(--color-surface)",
                      "--pixel-card-shadow": "none",
                      "--pixel-card-edge": "transparent",
                      "--pixel-card-edge-active": "transparent",
                      "--pixel-card-highlight": "transparent",
                    } as CSSProperties
                  }
                >
                  <div className="flex h-full flex-col items-start justify-start">
                    <h3 className="font-sans text-2xl text-white">{f.title}</h3>
                    <p className="mt-2 font-sans text-base font-light leading-[26px] text-white/60">
                      {f.body}
                    </p>
                  </div>
                </PixelCard>
              </Reveal>
            ))}
          </div>
        </div>
        <div className="hairline" />
      </section>
    </>
  );
}
