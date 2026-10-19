import Image from "next/image";
import { Reveal } from "./Reveal";
import { SectionBand } from "./SectionBand";
import BlurText from "./ui/BlurText";

const PILLARS = [
  {
    title: "Your voice, kept.",
    body: "No flat robot tone. Every draft reads like something you would actually write.",
  },
  {
    title: "The boring stuff stays quiet.",
    body: "Routine updates never become posts. Only work worth your readers' time gets a draft.",
  },
  {
    title: "No more staring at a blank box.",
    body: "One command turns finished work into a starting draft, right where you already work.",
  },
] as const;

/** The problem: good work that never gets posted. */
export function Problem() {
  return (
    <>
      <SectionBand label="The problem" />
      <section id="problem" className="bg-black">
        <div className="mx-auto grid w-full max-w-[1440px] items-center gap-14 border-x border-line bg-panel px-6 py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:gap-16 lg:px-[90px] lg:py-20">
          <div className="max-w-[720px]">
            <h2 className="text-balance text-[40px] font-normal leading-[40px]">
              <BlurText
                as="span"
                text="Say goodbye to your"
                className="text-faint-text"
                style={{ display: "inline-flex" }}
              />
              <br />
              <BlurText
                as="span"
                text="shipping in silence."
                className="text-white"
                style={{ display: "inline-flex" }}
              />
            </h2>
            <Reveal delay={100}>
              <p className="mt-6 max-w-[384px] font-sans text-base font-light leading-5 text-subtle">
                Writing about your work takes time you do not have.
                Drafts pile up, momentum fades, and good work goes unnoticed.{" "}
                <span className="text-white">
                  Postdiff turns finished work into a first draft.
                </span>
              </p>
            </Reveal>
            <div className="mt-12 border-y border-line-faint">
              {PILLARS.map((p, i) => (
                <Reveal
                  key={p.title}
                  as="article"
                  delay={i * 100}
                  className="border-line-faint py-6 not-last:border-b"
                >
                  <h3 className="font-sans text-lg text-white">{p.title}</h3>
                  <p className="mt-1 max-w-[384px] font-sans text-[15px] font-light leading-6 text-white/60">
                    {p.body}
                  </p>
                </Reveal>
              ))}
            </div>
          </div>

          <Reveal delay={180} className="w-full justify-self-end">
            <div className="relative mx-auto w-full max-w-[560px]">
              <Image
                src="/ss.webp"
                alt="Postdiff setup terminal showing local configuration and storage paths"
                width={1600}
                height={1000}
                sizes="(min-width: 1024px) 42vw, 100vw"
                className="w-full h-auto"
              />
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
