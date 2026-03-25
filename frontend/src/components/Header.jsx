export default function Header() {
  return (
    <header className="w-full border-b border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
      <div className="mx-auto flex max-w-full flex-col items-center justify-center gap-1 px-4 py-3 sm:gap-1.5 sm:px-6 sm:py-4">
        <img
          src="/assets/logo.jpg"
          alt="ValuZip logo"
          className="h-auto w-auto max-h-9 max-w-[min(100%,200px)] object-contain sm:max-h-10"
        />
        <h1 className="text-center text-2xl font-bold leading-tight tracking-tight text-[#006400] sm:text-3xl sm:leading-tight">
          ValuZip
        </h1>
      </div>
    </header>
  );
}
