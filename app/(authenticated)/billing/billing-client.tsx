"use client";

export default function BillingClient() {
  return (
    <button
      className="btn-gold w-full mt-4"
      onClick={() => {
        // Placeholder — we'll integrate Stripe next
        alert("Stripe checkout to be added");
      }}
    >
      Subscribe Now
    </button>
  );
}

