export default function Header() {
  return (
    <header className="w-full border-b border-gray-200 bg-white flex justify-center items-center shadow-sm">
      <div className="flex flex-col items-center justify-center py-2">
        <img
          src="/assets/logo.jpg"
          alt="ValuZip logo"
          className="h-12 w-auto object-contain mb-0"
        />

        <h1
          className="text-[20px] font-extrabold leading-none tracking-tight -mt-1"
          style={{ color: "#006400" }}
        >
          ValuZip
        </h1>
      </div>
    </header>
  );
}