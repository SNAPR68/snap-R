'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { User, Building2, ChevronDown } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);

  const roles = [
    'Real Estate Photographer',
    'Real Estate Agent',
    'Property Manager',
    'Brokerage House',
    'Property Owner',
    'Other',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !role) return;
    
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      await supabase.from('users').update({
        name,
        company,
        role,
        onboarded: true,
      }).eq('id', user.id);
    }
    
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center p-8">
      {/* Gold Frame Border */}
      <div className="fixed inset-0 pointer-events-none z-50">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#D4A017] to-transparent opacity-60" />
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#D4A017] to-transparent opacity-60" />
        <div className="absolute top-0 bottom-0 left-0 w-[3px] bg-gradient-to-b from-transparent via-[#D4A017] to-transparent opacity-60" />
        <div className="absolute top-0 bottom-0 right-0 w-[3px] bg-gradient-to-b from-transparent via-[#D4A017] to-transparent opacity-60" />
      </div>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <img src="/snapr-logo.png" alt="SnapR" className="w-16 h-16" />
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to SnapR</h1>
          <p className="text-white/60">Let's get to know you better</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-white/60 mb-2">Full Name *</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                placeholder="John Smith"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#D4A017]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-2">Company Name</label>
            <div className="relative">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                placeholder="ABC Realty"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#D4A017]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-2">Your Role *</label>
            <div className="relative">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#D4A017] appearance-none cursor-pointer"
                required
              >
                <option value="" className="bg-[#1A1A1A]">Select your role</option>
                {roles.map((r) => (
                  <option key={r} value={r} className="bg-[#1A1A1A]">{r}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 pointer-events-none" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !name || !role}
            className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-[#D4A017] to-[#B8860B] text-black disabled:opacity-50 mt-6"
          >
            {loading ? 'Setting up...' : 'Continue'}
          </button>
        </form>

        <p className="text-center text-white/40 mt-6">
          Already have an account? <Link href="/auth/login" className="text-[#D4A017] hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
