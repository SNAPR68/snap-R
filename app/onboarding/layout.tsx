export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-charcoal-deep text-white px-6">
      {children}
    </div>
  );
}

