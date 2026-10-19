import { SectionBand } from "./SectionBand";
import { Faq as RareFaq } from "./ui/faq";
import BlurText from "./ui/BlurText";

const FAQS = [
  {
    q: "How does Postdiff write in my voice?",
    a: "You share a few examples of your writing when you set it up. Every draft follows those samples, alongside examples of posts you liked, so the result reads like you wrote it.",
  },
  {
    q: "How does it decide what is worth posting?",
    a: "It looks at what changed and what you wrote about it, then decides if it is worth your readers' time. Small fixes and routine updates stay quiet. You can always force a draft if you disagree.",
  },
  {
    q: "Where do my writing samples and drafts live?",
    a: "On your own machine, as plain files you can read, back up, or delete. Your keys stay in a separate private file and are never mixed into your settings.",
  },
  {
    q: "Which AI providers work with it?",
    a: "It works with the popular providers, including Groq, OpenAI, Anthropic, and Google, plus a few more. You pick one during setup and can switch later. Optional web lookup stays off unless you ask for it.",
  },
  {
    q: "How is this different from auto-posting bots?",
    a: "Most tools connect to your accounts and post on their own schedule. Postdiff runs on your machine, skips the boring stuff, writes in your voice, and never posts anything without your approval.",
  },
  {
    q: "Can it post for me automatically?",
    a: "No. You always see and edit the draft first, then you copy it and paste it where you like. There is no auto-posting, ever.",
  },
  {
    q: "What kinds of posts can it write?",
    a: "Short posts for X, longer ones for LinkedIn, and full blog drafts in Markdown. Video scripts are planned for a later release.",
  },
  {
    q: "What does it cost?",
    a: "Postdiff itself is free while it runs on your own API keys, so you only pay whatever your provider charges, which is usually a few cents per draft. There is no subscription.",
  },
] as const;

/** FAQ: split layout with the Rare UI conversational accordion. */
export function Faq() {
  return (
    <>
      <SectionBand label="FAQ" />
      <section id="faq" className="bg-surface">
        <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-10 px-6 py-24 lg:grid-cols-[380px_1fr] lg:gap-6 lg:px-[91px]">
          <BlurText
            as="h2"
            text="Frequently Asked Questions"
            className="text-balance text-[40px] font-normal leading-[44px] text-white"
          />
          <RareFaq
            items={FAQS.map((f, i) => ({
              id: `faq-${i}`,
              question: f.q,
              answer: f.a,
            }))}
            defaultValue="faq-0"
            accent="#a6d609"
            avatar={null}
            className="max-w-none gap-3"
          />
        </div>
        <div className="hairline" />
      </section>
    </>
  );
}
