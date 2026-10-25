import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Finale } from "../_components/Finale";
import { Nav } from "../_components/Nav";
import { Reveal } from "../_components/Reveal";
import { SectionBand } from "../_components/SectionBand";
import { PageGrid, SiteFrame } from "../_components/SiteFrame";
import { RailToc } from "../_components/ui/rail-toc";
import { TaskList } from "../_components/ui/task-list";
import BlurText from "../_components/ui/BlurText";

export const metadata: Metadata = {
  title: "Postdiff docs: from finished work to a first draft",
  description:
    "Install Postdiff, configure your voice, and turn meaningful git changes into drafts you can review before sharing.",
  alternates: { canonical: "/docs" },
};

const WORKFLOW = [
  {
    index: "01",
    title: "Set up once",
    body: "Choose your provider, add your keys, and give Postdiff a few writing samples to work from.",
  },
  {
    index: "02",
    title: "Generate from a commit.",
    body: "Run the command from a repository. Postdiff checks whether the change is worth sharing before it writes anything.",
  },
  {
    index: "03",
    title: "Review the draft",
    body: "Edit, accept, or reject the draft in the terminal. Your decision can sharpen future drafts.",
  },
  {
    index: "04",
    title: "Copy and publish",
    body: "Once accepted, copy the draft to your clipboard and paste it wherever you publish. No account connection required.",
  },
] as const;

const COMMANDS = [
  ["postdiff setup", "Configure your name, keys, provider, model, and optional voice samples."],
  ["postdiff context", "Inspect the generation-ready context for a commit without calling a model."],
  ["postdiff generate", "Draft one format from the latest commit. Add --x, --linkedin, or --blog to choose it."],
  ["postdiff review", "Read, edit, accept, or reject the stored draft before it can be published."],
  ["postdiff publish", "Copy an accepted, hash-matched draft to your clipboard."],
] as const;

export default function DocsPage() {
  return (
    <SiteFrame>
      <Nav />
      <main id="main">
        <SectionBand label="Docs" />

        <div className="bg-black">
          <PageGrid>
            {/* Single grid for the whole body: the right rail spans every
                row and sticks, so the scroll-spy stays visible past the hero.
                The span below covers all body rows, bump it when adding sections. */}
            <div className="document-with-rail grid lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="min-w-0 bg-surface px-6 py-20 lg:px-[91px] lg:py-24">
                <Reveal motion="fade">
                  <p className="eyebrow text-volt">Quickstart</p>
                  <BlurText
                    as="h1"
                    text="From finished work to a draft you can stand behind."
                    className="mt-4 max-w-[720px] text-balance text-[40px] font-normal leading-[44px] sm:text-[56px] sm:leading-[56px]"
                  />
                </Reveal>
                <Reveal delay={100}>
                  <p className="mt-5 max-w-[600px] font-sans text-base font-light leading-[26px] text-white/60">
                    Postdiff runs where your code already lives. Install it,
                    teach it how you write, then turn a meaningful commit into
                    a reviewable post without handing over your repository.
                  </p>
                </Reveal>

                <Reveal delay={200} className="mt-10">
                  <div className="border border-line-soft bg-ink">
                    <div className="flex items-center justify-between border-b border-line-soft px-4 py-3">
                      <span className="font-mono text-xs text-white/50">
                        terminal / first run
                      </span>
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-code-green">
                        local-first
                      </span>
                    </div>
                    <pre className="overflow-x-auto px-4 py-5 font-mono text-sm leading-7 text-body">
                      <code>{`npm i -g postdiff\npostdiff setup\npostdiff generate`}</code>
                    </pre>
                  </div>
                </Reveal>

                <Reveal delay={300} className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href="#workflow"
                    className="btn-primary inline-flex items-center gap-3 px-4 py-3.5 font-sans text-base font-medium"
                  >
                    See the workflow
                    <ArrowRight size={16} strokeWidth={2} absoluteStrokeWidth aria-hidden="true" />
                  </Link>
                  <Link
                    href="#commands"
                    className="btn-ghost inline-flex items-center px-4 py-3.5 font-sans text-base"
                  >
                    Browse commands
                  </Link>
                </Reveal>
                <Reveal delay={350} className="mt-8 border-t border-line pt-5">
                  <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/35">
                    Agent resources
                  </p>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 font-mono text-xs text-white/55">
                    <a className="underline decoration-white/20 underline-offset-4 hover:text-white" href="/openapi.json">
                      OpenAPI
                    </a>
                    <a className="underline decoration-white/20 underline-offset-4 hover:text-white" href="/llms.txt">
                      llms.txt
                    </a>
                    <a className="underline decoration-white/20 underline-offset-4 hover:text-white" href="/.well-known/mcp">
                      MCP manifest
                    </a>
                  </div>
                </Reveal>
              </div>

              <div className="lg:col-start-2 lg:[grid-row:1/8]">
                <aside className="border-t border-line bg-black/20 px-6 py-8 lg:sticky lg:top-8 lg:max-h-[calc(100svh-4rem)] lg:overflow-y-auto lg:border-t-0 lg:px-7 lg:py-10">
                  <RailToc
                    className="w-full"
                    title="On this page"
                    items={[
                      { id: "workflow", label: "Workflow" },
                      { id: "commands", label: "Commands" },
                      { id: "privacy", label: "Privacy model" },
                    ]}
                  />
                  <div className="mt-10 border-t border-line pt-5">
                    <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/35">
                      First run
                    </p>
                    <TaskList
                      size="sm"
                      accent="#a6d609"
                      className="mt-4 w-full items-stretch"
                      defaultTasks={[
                        { id: "install", label: "Install Postdiff" },
                        { id: "setup", label: "Run setup" },
                        { id: "draft", label: "Generate a draft" },
                      ]}
                    />
                  </div>
                </aside>
              </div>

              <div className="min-w-0 lg:col-start-1">
                <SectionBand label="Workflow" framed={false} />
              </div>
              <div id="workflow" className="min-w-0 scroll-mt-0 bg-black px-6 py-20 lg:col-start-1 lg:px-[91px] lg:py-24">
              <h2 className="max-w-[640px] text-balance text-[40px] font-normal leading-[44px]">
                <BlurText
                  as="span"
                  text="A short path from commit"
                  className="text-white"
                  style={{ display: "inline-flex" }}
                />
                <br />
                <BlurText
                  as="span"
                  text="to something worth sharing."
                  className="text-white/60"
                  style={{ display: "inline-flex" }}
                />
              </h2>
              <div className="mt-10 grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2">
                {WORKFLOW.map((step, i) => (
                  <Reveal
                    key={step.index}
                    as="article"
                    delay={(i % 2) * 100}
                    className="bg-panel p-6 lg:p-7"
                  >
                    <p className="font-mono text-xs tabular-nums text-volt">
                      {step.index}
                    </p>
                    <h3 className="mt-8 font-sans text-2xl text-white">
                      {step.title}
                    </h3>
                    <p className="mt-2 max-w-[36ch] font-sans text-[15px] font-light leading-7 text-white/60">
                      {step.body}
                    </p>
                  </Reveal>
                ))}
              </div>
              </div>
              <div className="min-w-0 lg:col-start-1">
                <SectionBand label="Commands" framed={false} />
              </div>
              <div id="commands" className="min-w-0 scroll-mt-0 bg-surface lg:col-start-1">
              <div className="grid lg:grid-cols-[280px_minmax(0,1fr)]">
              <div className="border-b border-line px-6 py-10 lg:border-b-0 lg:border-r lg:px-7 lg:py-12">
                <p className="eyebrow text-volt">Command surface</p>
                <p className="mt-4 font-sans text-base font-light leading-7 text-white/60">
                  Each command is explicit. Nothing runs in the background and
                  no platform account is connected for you.
                </p>
              </div>
              <div className="divide-y divide-line">
                {COMMANDS.map(([command, description], i) => (
                  <Reveal key={command} as="article" delay={Math.min(i, 2) * 70} className="grid gap-3 px-6 py-6 sm:grid-cols-[240px_1fr] sm:items-start lg:px-8">
                    <code className="font-mono text-sm text-white">{command}</code>
                    <p className="font-sans text-[15px] font-light leading-7 text-white/60">
                      {description}
                    </p>
                  </Reveal>
                ))}
              </div>
              </div>
              </div>
              <div className="min-w-0 lg:col-start-1">
                <SectionBand label="Privacy model" framed={false} />
              </div>
              <div id="privacy" className="min-w-0 scroll-mt-0 bg-black lg:col-start-1">
            <div className="grid lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="px-6 py-20 lg:px-[91px] lg:py-24">
                <Reveal motion="fade">
                  <p className="eyebrow text-volt">Keep control</p>
                  <BlurText
                    as="h2"
                    text="Your files stay yours."
                    className="mt-4 max-w-[640px] text-[40px] font-normal leading-[44px]"
                  />
                </Reveal>
                <Reveal delay={100}>
                  <p className="mt-4 max-w-[600px] font-sans text-base font-light leading-7 text-white/60">
                    Voice samples, reference posts, preferences, drafts, and
                    review history live under your local Postdiff directory.
                    Only the context needed for a generation is sent to the
                    provider you choose.
                  </p>
                </Reveal>
              </div>
              <div className="border-t border-line px-6 py-8 lg:border-l lg:border-t-0 lg:px-7 lg:py-10">
                <ul className="flex flex-col gap-4 font-mono text-xs uppercase tracking-[0.12em] text-white/55">
                  <li className="flex items-center gap-3"><Check size={14} className="text-code-green" aria-hidden="true" /> Local profile files</li>
                  <li className="flex items-center gap-3"><Check size={14} className="text-code-green" aria-hidden="true" /> Draft-first review</li>
                  <li className="flex items-center gap-3"><Check size={14} className="text-code-green" aria-hidden="true" /> Copy-only publishing</li>
                </ul>
              </div>
            </div>
            </div>
            </div>
          </PageGrid>
        </div>
      </main>
      <Finale />
    </SiteFrame>
  );
}
