import HowItWorks from "./ui/how-it-works";
import { Reveal } from "./Reveal";
import { SectionBand } from "./SectionBand";
import BlurText from "./ui/BlurText";

/** How it works: five pinned steps from finished work to copied draft. */
export function HowItWorksSection() {
  return (
    <>
      <SectionBand label="How it works" />
      <section id="how" className="bg-surface">
        <div className="mx-auto w-full max-w-[1440px] px-6 pt-14 lg:px-[91px] lg:pt-16">
          <Reveal className="max-w-[640px]" motion="fade">
            <h2 className="text-balance text-[32px] font-normal leading-[36px] text-white sm:text-[40px] sm:leading-[44px]">
              <BlurText
                as="span"
                text="Five steps."
                style={{ display: "inline-flex" }}
              />{" "}
              <BlurText
                as="span"
                text="You approve every word."
                className="text-white/60"
                style={{ display: "inline-flex" }}
              />
            </h2>
            <p className="mt-4 max-w-[576px] font-sans text-base font-light leading-[26px] text-white/60">
              From the commit you just shipped to a draft that sounds like you.{" "}
              <span className="text-white">Draft-first, always.</span>
            </p>
          </Reveal>
        </div>
        <Reveal delay={120} motion="fade">
          <HowItWorks />
        </Reveal>
        <div className="hairline" />
      </section>
    </>
  );
}
