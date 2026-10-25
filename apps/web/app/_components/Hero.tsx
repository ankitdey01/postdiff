import { ChevronDown } from "lucide-react";
import { KyotoDuskBackdrop } from "./KyotoDuskBackdrop";
import { Reveal } from "./Reveal";
import { ScrollButton } from "./ScrollButton";
import { ScrollCta } from "./ScrollCta";
import TechText from "./TechText";
import ShinyText from "./ui/ShinyText";

/** Hero: left-aligned copy. The live terminal lives in the solution section. */
export function Hero() {
  return (
    <section className="relative overflow-hidden bg-surface">
      {/* Kyoto dusk ascii scene behind the hero copy, kept inside the
          grid box so nothing spills sideways. Dimmed so copy stays readable. */}
      <div className="relative mx-auto flex w-full max-w-[1440px] flex-col items-start justify-center overflow-hidden px-6 pb-28 pt-24 text-left sm:min-h-[480px] sm:py-20 lg:min-h-[600px] lg:px-[91px] lg:py-12">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
        >
          <div className="absolute left-1/2 top-[58%] w-[215%] max-w-none -translate-x-1/2 -translate-y-1/2 opacity-[0.58] sm:top-1/2 sm:w-[180%] sm:opacity-100 lg:w-full">
            <KyotoDuskBackdrop />
          </div>
          <div className="absolute inset-0 bg-surface/60 sm:bg-surface/50" />
          <div className="absolute inset-0 bg-gradient-to-b from-surface via-transparent to-surface" />
          <div className="absolute inset-x-0 top-0 z-[1] h-20 bg-gradient-to-b from-surface via-surface/95 to-transparent sm:hidden" />
        </div>
        <div className="relative z-10 flex w-full translate-y-0 flex-col items-start justify-center gap-4 text-left sm:-translate-y-4 sm:gap-2 lg:-translate-y-6 lg:py-0">
          {/* TechText centers its ink inside a fixed canvas, so offset the
              canvas slack rather than leaving a false gap before the copy. */}
          <Reveal delay={0} className="w-full sm:-mb-12">
            <h1 className="sr-only">
              Postdiff — the Git commit-to-post generator that sounds like you wrote it
            </h1>
            <div aria-hidden="true" className="w-full max-w-[720px] -translate-x-1.5 sm:translate-x-0">
              <div className="h-[176px] w-full sm:h-[288px] lg:h-[348px]">
                <TechText
                  text={'Turn commits\ninto posts that sound\nlike you wrote them'}
                  fontWeight={300}
                  fontSize={80}
                  letterSpacing={-0.01}
                  color="#ffffff"
                  accentColor="#c8f902"
                  reveal="letter"
                  align="left"
                  className="font-hero"
                  style={{ width: "100%", height: "100%" }}
                />
              </div>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <p className="max-w-[640px] text-sm font-medium leading-6 text-zinc-400 sm:text-xl sm:leading-8">
              <span className="sm:hidden">
                <ShinyText
                  text="Postdiff picks the work worth sharing and drafts the post in your voice."
                  color="#a1a1aa"
                  shineColor="#ffffff"
                  speed={2}
                  delay={1.5}
                  shineWidth={30}
                  softness={0.9}
                />
              </span>
              <span className="hidden sm:inline">
                <ShinyText
                  text="Postdiff picks the work worth sharing and drafts the post in your voice. You approve every word before anything goes out."
                  color="#a1a1aa"
                  shineColor="#ffffff"
                  speed={2}
                  delay={1.5}
                  shineWidth={30}
                  softness={0.9}
                />
              </span>
            </p>
          </Reveal>
        </div>
      </div>

      <div className="hairline" />
      <div className="mx-auto flex w-full max-w-[1440px] flex-col items-stretch gap-3 px-6 py-4 sm:flex-row sm:gap-0 sm:py-0 lg:px-[91px]">
        <ScrollCta
          to="start"
          ariaLabel="Start for free"
          className="hero-start-cta h-14 w-full min-w-0 sm:h-[52px] sm:w-[220px]"
          labelClassName="ml-[40px] mr-1 text-base sm:ml-[62px] sm:mr-4 sm:text-base"
        >
          Start for free
        </ScrollCta>
        <ScrollButton
          to="how"
          className="btn-ghost hero-cta group flex h-14 w-full shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap px-2 py-3.5 font-sans text-base shadow-none sm:h-auto sm:w-[200px] sm:px-4 sm:text-base"
        >
          See how it works <ChevronDown size={16} strokeWidth={2} absoluteStrokeWidth aria-hidden="true" className="hero-cta-icon hero-cta-icon-y" />
        </ScrollButton>
        <div className="tick-strip hidden min-h-[52px] flex-1 md:block" aria-hidden="true" />
      </div>
      <div className="hairline" />
    </section>
  );
}
