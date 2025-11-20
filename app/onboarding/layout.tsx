export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-quartz-light dark:bg-quartz-dark text-carbon dark:text-white px-6">
      {children}
    </div>
  );
}

