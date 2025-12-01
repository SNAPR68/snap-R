export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F0F0F] text-white px-6">
      {children}
    </div>
  );
}

