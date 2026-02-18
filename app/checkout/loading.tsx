export default function CheckoutLoading() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
      <div className="w-full max-w-lg space-y-6 p-6">
        <div className="h-8 w-64 bg-white/5 rounded-lg animate-pulse mx-auto" />
        <div className="h-48 bg-white/5 rounded-xl animate-pulse" />
        <div className="h-12 bg-white/5 rounded-xl animate-pulse" />
      </div>
    </div>
  );
}
