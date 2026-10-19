import { CodeWindow } from "./CodeWindow";
import { Reveal } from "./Reveal";
import { SectionBand } from "./SectionBand";
import BlurText from "./ui/BlurText";

/** The solution: live terminal demo of the postdiff flow. */
export function Solution() {
  return (
    <>
      <SectionBand label="The solution" />
      <section id="solution" className="bg-surface">
        <div className="mx-auto w-full max-w-[1440px] px-6 py-20 lg:px-[91px] lg:py-24">
          <Reveal className="max-w-[720px]" motion="fade">
            <BlurText
              as="h2"
              text="How finished work becomes a post"
              className="text-balance text-[40px] font-normal leading-[44px] text-white sm:text-[48px] sm:leading-[50px]"
            />
            <p className="mt-4 max-w-[576px] font-sans text-base font-light leading-[26px] text-white/60">
              Postdiff sits between your work and your readers. One command
              turns what you shipped into a draft.{" "}
              <span className="text-white">You decide what goes out.</span>
            </p>
          </Reveal>

          {/* Live terminal demo, moved here from the problem section. */}
          <div aria-label="Live postdiff terminal demo" className="mt-12 flex justify-center">
            <Reveal delay={100} motion="fade" className="w-full max-w-[1000px]">
              <CodeWindow />
            </Reveal>
          </div>
        </div>
        <div className="hairline" />
      </section>
    </>
  );
}
