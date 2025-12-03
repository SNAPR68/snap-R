'use client';

import { useState } from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';

export function HumanEditActions({ orderId, status, userEmail }: { orderId: string; status: string; userEmail?: string }) {
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(status === 'completed');

  const markComplete = async () => {
    if (!confirm('Mark this order as completed? Customer will be notified.')) return;
    setLoading(true);

    try {
      const res = await fetch('/api/admin/complete-human-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, userEmail }),
      });

      if (res.ok) {
        setCompleted(true);
      }
    } catch (e) {
      alert('Failed to update');
    } finally {
      setLoading(false);
    }
  };

  if (completed) {
    return (
      <span className="flex items-center gap-1 text-green-400 text-sm">
        <CheckCircle className="w-4 h-4" /> Done
      </span>
    );
  }

  return (
    <button
      onClick={markComplete}
      disabled={loading}
      className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 disabled:opacity-50 flex items-center gap-1"
    >
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
      Complete
    </button>
  );
}
