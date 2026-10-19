import { Reveal } from "./Reveal";

/**
 * Brand marks inlined as paths: zero network requests and no heavy imports.
 * Rendered monochrome to match the site.
 */
function BrandIcon({ d, label }: { d: string; label: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      role="img"
      aria-label={label}
      className="h-5 w-5 shrink-0"
    >
      <path d={d} />
    </svg>
  );
}

const PLATFORMS = [
  {
    name: "X",
    d: "M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z",
  },
  {
    name: "LinkedIn",
    d: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
  },
  {
    name: "Dev.to",
    d: "M7.42 10.05c-.18-.16-.46-.23-.84-.23H6l.02 2.44.04 2.45.56-.02c.41 0 .63-.07.83-.26.24-.24.26-.36.26-2.2 0-1.91-.02-1.96-.29-2.18zM0 4.94v14.12h24V4.94H0zM8.56 15.3c-.44.58-1.06.77-2.53.77H4.71V8.53h1.4c1.67 0 2.16.18 2.6.9.27.43.29.6.32 2.57.05 2.23-.02 2.73-.47 3.3zm5.09-5.47h-2.47v1.77h1.52v1.28l-.72.04-.75.03v1.77l1.22.03 1.2.04v1.28h-1.6c-1.53 0-1.6-.01-1.87-.3l-.3-.28v-3.16c0-3.02.01-3.18.25-3.48.23-.31.25-.31 1.88-.31h1.64v1.3zm4.68 5.45c-.17.43-.64.79-1 .79-.18 0-.45-.15-.67-.39-.32-.32-.45-.63-.82-2.08l-.9-3.39-.45-1.67h.76c.4 0 .75.02.75.05 0 .06 1.16 4.54 1.26 4.83.04.15.32-.7.73-2.3l.66-2.52.74-.04c.4-.02.73 0 .73.04 0 .14-1.67 6.38-1.8 6.68z",
  },
  {
    name: "Hashnode",
    d: "M22.351 8.019l-6.37-6.37a5.63 5.63 0 0 0-7.962 0l-6.37 6.37a5.63 5.63 0 0 0 0 7.962l6.37 6.37a5.63 5.63 0 0 0 7.962 0l6.37-6.37a5.63 5.63 0 0 0 0-7.962zM12 15.953a3.953 3.953 0 1 1 0-7.906 3.953 3.953 0 0 1 0 7.906z",
  },
  {
    name: "Blog",
    d: "M19.199 24C19.199 13.467 10.533 4.8 0 4.8V0c13.165 0 24 10.835 24 24h-4.801zM3.291 17.415c1.814 0 3.293 1.479 3.293 3.295 0 1.813-1.485 3.29-3.301 3.29C1.47 24 0 22.526 0 20.71s1.475-3.294 3.291-3.295zM15.909 24h-4.665c0-6.169-5.075-11.245-11.244-11.245V8.09c8.727 0 15.909 7.184 15.909 15.91z",
  },
] as const;

/** Where your drafts can end up: one caption, familiar marks, nothing else. */
export function LogoStrip() {
  return (
    <section className="bg-surface" aria-label="Post anywhere">
      <Reveal>
        <p className="px-6 pt-10 text-center font-sans text-sm font-light text-white/60 lg:px-[91px]">
          Write once, share wherever your readers are
        </p>
      </Reveal>
      <div className="mx-auto w-full max-w-[1440px] px-6 pb-10 pt-6 lg:px-[91px]">
        <div className="grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-5">
          {PLATFORMS.map((p, i) => (
            <Reveal
              key={p.name}
              as="div"
              delay={100 + i * 60}
              className="flex items-center justify-center gap-2.5 bg-surface px-4 py-6 text-white/60 last:col-span-2 sm:last:col-span-1"
            >
              <BrandIcon d={p.d} label={p.name} />
              <span className="font-mono text-xs uppercase tracking-widest">
                {p.name}
              </span>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
