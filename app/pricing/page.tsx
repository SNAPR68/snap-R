import { Suspense } from 'react';
import PricingContent from './pricing-content';

export default function PricingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#D4A017] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <PricingContent />
    </Suspense>
  );
}
