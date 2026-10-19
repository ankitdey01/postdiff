import { Reveal } from "./Reveal";
import { SectionBand } from "./SectionBand";
import BlurText from "./ui/BlurText";

const STATS = [
  {
    value: "03",
    unit: "post types",
    body: "Short posts, longer posts, and full blog drafts from a single command.",
  },
  {
    value: "01",
    unit: "command",
    body: "Run it where you work and get a draft back. No tabs, no dashboards.",
  },
  {
    value: "00",
    unit: "surprises",
    body: "Nothing posts itself. Every draft waits for your approval first.",
  },
  {
    value: "00",
    unit: "logins",
    body: "No account connections and no permissions to manage. Copy, paste, done.",
  },
] as const;

/** Proof: plain numbers that describe the tool honestly. */
export function Proof() {
  const [lead, ...rest] = STATS;

  return (
    <>
      <SectionBand label="Proof" />
      <section id="proof" className="bg-surface">
        <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-10 px-6 py-24 lg:grid-cols-[380px_1fr] lg:gap-6 lg:px-[91px]">
          <div>
            <h2 className="text-balance text-[40px] font-normal leading-[44px]">
              <BlurText
                as="span"
                text="Small tool,"
                className="text-white"
                style={{ display: "inline-flex" }}
              />
              <br />
              <BlurText
                as="span"
                text="clear promises"
                className="text-white/60"
                style={{ display: "inline-flex" }}
              />
            </h2>
            <Reveal delay={100}>
              <p className="mt-4 max-w-[340px] font-sans text-base font-light leading-[26px] text-white/60">
                No big claims. Just what it does and what it never does.
              </p>
            </Reveal>
          </div>
          <div className="grid gap-px border border-line bg-line lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
            <Reveal className="relative flex min-h-[260px] flex-col justify-between bg-lime/[0.09] p-7 lg:p-8">
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-volt">
                The output
              </span>
              <div>
                <p className="font-mono text-6xl leading-none tabular-nums text-white">
                  {lead.value}
                </p>
                <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.16em] text-white/65">
                  {lead.unit}
                </p>
                <p className="mt-5 max-w-[30ch] font-sans text-[15px] font-light leading-6 text-white/70">
                  {lead.body}
                </p>
              </div>
            </Reveal>
            <div className="grid divide-y divide-line bg-panel">
              {rest.map((s, i) => (
                <Reveal key={s.unit} delay={(i + 1) * 80} className="grid gap-4 px-6 py-5 sm:grid-cols-[120px_1fr] sm:items-center">
                  <p className="font-mono text-2xl leading-none tabular-nums text-volt">
                    {s.value}
                    <span className="ml-2 align-middle text-[10px] uppercase tracking-[0.14em] text-white/45">
                      {s.unit}
                    </span>
                  </p>
                  <p className="font-sans text-[15px] font-light leading-6 text-white/60">
                    {s.body}
                  </p>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
        <div className="hairline" />
      </section>
    </>
  );
}
