/** Full-width black strip carrying the `// SECTION` mono marker. */
export function SectionBand({
  label,
  framed = true,
}: {
  label: string;
  /** Render without the inner max-width frame when nested inside one. */
  framed?: boolean;
}) {
  const frameClassName = framed
    ? "mx-auto w-full max-w-[1440px] border-x border-line"
    : "";

  return (
    <div className="border-y border-line bg-black">
      <div className={`${frameClassName} px-6 py-[26px] lg:px-[91px]`}>
        <p className="font-mono text-sm uppercase leading-none text-white/60">
          {"//"} {label}
        </p>
      </div>
    </div>
  );
}
