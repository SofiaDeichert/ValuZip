export default function Header() {
  return (
    <header className="w-full border-b border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
      <div className="mx-auto flex max-w-full flex-col items-center justify-center gap-3 px-6 py-8 sm:py-9">
        <img
          src="/assets/logo.jpg"
          alt="ValuZip logo"
          className="h-16 w-auto max-w-[min(100%,280px)] object-contain sm:h-[4.5rem]"
        />
        <h1 className="text-center text-[1.3125rem] font-bold leading-snug tracking-tight text-[#006400] sm:text-[1.375rem]">
          ValuZip
        </h1>
      </div>
    </header>
  );
}
