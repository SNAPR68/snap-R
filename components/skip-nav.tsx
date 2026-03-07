export function SkipNav() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-[#D4A017] focus:text-black focus:font-medium focus:rounded-lg focus:outline-none"
    >
      Skip to main content
    </a>
  );
}
