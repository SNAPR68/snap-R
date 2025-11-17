"use client";

import PageShell from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";

export default function BillingPage() {
  return (
    <PageShell>
      <h1 className="text-3xl font-semibold mb-6">Billing</h1>

      <div className="p-6 border rounded-xl max-w-xl">
        <p className="text-lg mb-4">Basic Plan – ₹299/month</p>
        <Button>Subscribe</Button>
      </div>
    </PageShell>
  );
}
