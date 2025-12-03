import { createClient } from '@/lib/supabase/server';
export const dynamic = 'force-dynamic';

export default async function AdminUsers() {
  const supabase = await createClient();

  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Users</h1>
      
      <div className="bg-[#1A1A1A] border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-white/5">
            <tr>
              <th className="text-left p-4 text-white/60 font-medium">User</th>
              <th className="text-left p-4 text-white/60 font-medium">Plan</th>
              <th className="text-left p-4 text-white/60 font-medium">Credits</th>
              <th className="text-left p-4 text-white/60 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users?.map((user) => (
              <tr key={user.id} className="border-t border-white/5 hover:bg-white/5">
                <td className="p-4">
                  <p className="font-medium">{user.full_name || 'No name'}</p>
                  <p className="text-white/50 text-sm">{user.email}</p>
                </td>
                <td className="p-4">
                  <span className={`text-xs px-2 py-1 rounded ${user.plan === 'agency' ? 'bg-purple-500/20 text-purple-400' : user.plan === 'professional' ? 'bg-blue-500/20 text-blue-400' : user.plan === 'starter' ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/50'}`}>
                    {user.plan || 'Free'}
                  </span>
                </td>
                <td className="p-4">
                  <span className="text-[#D4A017] font-medium">{user.credits}</span>
                </td>
                <td className="p-4 text-white/50">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
