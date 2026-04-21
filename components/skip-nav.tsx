export function SkipNav() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-accent-gold focus:text-black"
    >
      Skip to main content
    </a>
  );
}
