import Link from "next/link";
import Image from "next/image";
import { MobileMenu } from "./MobileMenu";
import { ScrollCta } from "./ScrollCta";

const LINKS = [
  { label: "Docs", href: "/docs" },
  { label: "Pricing", href: "/pricing" },
  { label: "Privacy", href: "/privacy" },
  { label: "Support", href: "mailto:ankitdey450@gmail.com" },
] as const;

/** Top bar: logo on the left, product pages, one call to action. */
export function Nav() {
  return (
    <header className="bg-surface">
      <div aria-hidden="true" className="w-full bg-surface pt-[20px]">
        <div className="hairline" />
      </div>
      <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-10">
        <Link href="/" className="flex items-center gap-3" aria-label="Postdiff home">
          <Image 
            src="/logo.webp" 
            alt="Postdiff Logo" 
            width={28} 
            height={28}
            className="h-8 w-8 sm:h-9 sm:w-9"
          />
          <span className="eyebrow text-[15px] text-white sm:text-base">Postdiff</span>
        </Link>
        <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
          {LINKS.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="link-mono nav-link py-2 font-hero text-sm uppercase tracking-[0.1em] text-white/60 hover:text-white"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <ScrollCta
          to="start"
          ariaLabel="Start for free"
          className="hidden h-12 min-w-0 md:inline-flex"
          labelClassName="ml-[62px] mr-4 font-sans text-[13px] font-medium uppercase leading-none tracking-[0.1em]"
        >
          Start for free
        </ScrollCta>
        <div className="md:hidden">
          <MobileMenu links={LINKS} />
        </div>
      </div>
      <div aria-hidden="true" className="w-full">
        <div className="hairline" />
      </div>
    </header>
  );
}
