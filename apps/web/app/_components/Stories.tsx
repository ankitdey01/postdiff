import { ArrowUpRight } from "lucide-react";
import { Reveal } from "./Reveal";
import { SectionBand } from "./SectionBand";
import BlurText from "./ui/BlurText";
import Grainient from "./Grainient";

/** Builder story: lime testimony panel between two tonal rails. */
export function Stories() {
  return (
    <>
      <SectionBand label="Builder stories" />
      <section id="stories" className="bg-surface scroll-mt-0">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center gap-8 px-6 pb-16 pt-24 lg:px-[91px]">
          <div className="flex w-full flex-col items-start gap-4">
            <h2 className="text-balance text-[40px] font-normal leading-[44px]">
              <BlurText
                as="span"
                text="Shipped work,"
                className="text-white/60"
                style={{ display: "inline-flex" }}
              />{" "}
              <BlurText
                as="span"
                text="shared more often."
                className="text-white"
                style={{ display: "inline-flex" }}
              />
            </h2>
            <Reveal delay={100}>
              <p className="max-w-[576px] font-sans text-base font-light leading-[26px] text-white/60">
                For people who build in public and want posting to take minutes, not evenings.
              </p>
            </Reveal>
          </div>

          <Reveal className="flex w-full items-stretch gap-3" delay={200}>
            <div className="relative hidden w-20 shrink-0 overflow-hidden bg-volt sm:block" aria-hidden="true">
              <Grainient
                className="absolute inset-0"
                colors={["#222b11", "#82d305", "#c8f902"]}
                type="linear"
                angle={0}
                bands={2}
                flow={1.4}
                scale={0.8}
                softness={0.85}
                silk={0.4}
                grainAmount={0.1}
                speed={0.5}
                variation={1}
                interactive={false}
              />
              <div className="absolute inset-0 bg-black/30" />
            </div>
            <figure className="relative isolate flex-1 overflow-hidden bg-lime px-6 py-12 sm:px-12">
              <Grainient
                className="absolute inset-0 z-0"
                colors={["#222b11", "#82d305", "#97dc21", "#a6d609", "#c8f902"]}
                type="linear"
                angle={55}
                flow={0.9}
                scale={1}
                softness={1}
                silk={0.35}
                grainAmount={0.08}
                speed={0.7}
              />
              <div className="absolute inset-0 z-0 bg-black/30" aria-hidden="true" />
              <div
                className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_150%_150%_at_0%_0%,black_0%,transparent_92%)]"
                aria-hidden="true"
              />
              <span
                className="pointer-events-none absolute -bottom-24 -right-4 select-none font-mono text-[240px] font-bold leading-none text-white/[0.07]"
                aria-hidden="true"
              >
                “
              </span>
              <div className="relative z-10">
                <blockquote className="max-w-[676px] text-balance font-sans text-2xl font-normal leading-[38px] text-white sm:text-[30px]">
                  “Writing about my work kept losing to shipping it. Now finishing something gives me a first draft too.”
                </blockquote>
                <div className="mt-7 inline-flex items-center gap-2 bg-white px-3.5 py-2">
                  <span className="font-mono text-xs font-medium uppercase leading-[18px] text-ink">
                    Used on every release since day one
                  </span>
                  <span className="font-mono text-xs text-ink" aria-hidden="true"><ArrowUpRight size={12} strokeWidth={2} absoluteStrokeWidth /></span>
                </div>
                <figcaption className="mt-10 flex items-center gap-3.5">
                  <span className="flex h-14 w-14 items-center justify-center bg-white font-mono text-xl font-bold text-black" aria-hidden="true">
                    ›_
                  </span>
                  <span>
                    <span className="block font-sans text-sm font-medium leading-[17px] text-white">
                      Ankit Dey
                    </span>
                    <span className="mt-1 block font-sans text-[13px] font-normal leading-[17px] text-white/70">
                      Building Postdiff in public
                    </span>
                  </span>
                </figcaption>
              </div>
              <span className="pointer-events-none absolute left-6 top-6 h-4 w-4 border-l border-t border-white/70" aria-hidden="true" />
              <span className="pointer-events-none absolute right-6 top-6 h-4 w-4 border-r border-t border-white/70" aria-hidden="true" />
              <span className="pointer-events-none absolute bottom-6 left-6 h-4 w-4 border-b border-l border-white/70" aria-hidden="true" />
              <span className="pointer-events-none absolute bottom-6 right-6 h-4 w-4 border-b border-r border-white/70" aria-hidden="true" />
            </figure>
            <div className="relative hidden w-20 shrink-0 overflow-hidden bg-bud sm:block" aria-hidden="true">
              <Grainient
                className="absolute inset-0"
                colors={["#232b12", "#97dc21", "#82d305"]}
                type="linear"
                angle={0}
                bands={2}
                flow={1.4}
                scale={0.8}
                softness={0.85}
                silk={0.4}
                grainAmount={0.1}
                speed={0.5}
                variation={2}
                interactive={false}
              />
              <div className="absolute inset-0 bg-black/30" />
            </div>
          </Reveal>
        </div>
        <div className="hairline" />
      </section>
    </>
  );
}
