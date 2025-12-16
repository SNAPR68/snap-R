'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { 
  ArrowLeft, Users, Plus, Crown, Shield, Edit3, Eye, 
  Trash2, Mail, Copy, Check, Loader2, X, UserPlus,
  Building2
} from 'lucide-react';

interface Team {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  plan: string;
  credits: number;
  owner_id: string;
  role?: string;
  member_count?: number;
}

interface Member {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profiles: {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface Invite {
  id: string;
  email: string;
  role: string;
  created_at: string;
  expires_at: string;
  token?: string;
  url?: string;
}

const roleIcons: Record<string, typeof Crown> = {
  owner: Crown,
  admin: Shield,
  editor: Edit3,
  viewer: Eye
};

const roleColors: Record<string, string> = {
  owner: 'text-yellow-500',
  admin: 'text-purple-500',
  editor: 'text-blue-500',
  viewer: 'text-gray-500'
};

function TeamPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const teamId = searchParams.get('id');
  
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('editor');
  const [creating, setCreating] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchTeams = useCallback(async () => {
    try {
      const res = await fetch('/api/teams');
      const data = await res.json();
      if (data.teams) setTeams(data.teams);
    } catch (err) {
      console.error('Fetch teams error:', err);
    }
  }, []);

  const fetchTeamDetails = useCallback(async (id: string) => {
    try {
      const [teamRes, membersRes, invitesRes] = await Promise.all([
        fetch(`/api/teams/${id}`),
        fetch(`/api/teams/${id}/members`),
        fetch(`/api/teams/${id}/invite`)
      ]);
      
      const teamData = await teamRes.json();
      const membersData = await membersRes.json();
      const invitesData = await invitesRes.json();
      
      if (teamData.team) setSelectedTeam(teamData.team);
      if (membersData.members) {
        setMembers(membersData.members);
        const currentMember = membersData.members.find((m: Member) => m.user_id === currentUserId);
        setUserRole(currentMember?.role || null);
      }
      if (invitesData.invites) setInvites(invitesData.invites);
    } catch (err) {
      console.error('Fetch team details error:', err);
    }
  }, [currentUserId]);

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }
      setCurrentUserId(user.id);
      await fetchTeams();
      setLoading(false);
    };
    init();
  }, [router, fetchTeams]);

  useEffect(() => {
    if (teamId && currentUserId) {
      fetchTeamDetails(teamId);
    }
  }, [teamId, currentUserId, fetchTeamDetails]);

  const createTeam = async () => {
    if (!newTeamName.trim()) return;
    setCreating(true);
    setError(null);
    
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTeamName })
      });
      
      const data = await res.json();
      
      if (data.error) {
        setError(data.error);
      } else if (data.team) {
        setTeams([...teams, { ...data.team, role: 'owner' }]);
        setShowCreateTeam(false);
        setNewTeamName('');
        router.push(`/dashboard/team?id=${data.team.id}`);
      }
    } catch {
      setError('Failed to create team');
    } finally {
      setCreating(false);
    }
  };

  const sendInvite = async () => {
    if (!inviteEmail.trim() || !selectedTeam) return;
    setInviting(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/teams/${selectedTeam.id}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole })
      });
      
      const data = await res.json();
      
      if (data.error) {
        setError(data.error);
      } else if (data.invite) {
        setInvites([...invites, data.invite]);
        setShowInvite(false);
        setInviteEmail('');
        if (data.invite.url) {
          navigator.clipboard.writeText(data.invite.url);
          setCopied(data.invite.id);
          setTimeout(() => setCopied(null), 3000);
        }
      }
    } catch {
      setError('Failed to send invite');
    } finally {
      setInviting(false);
    }
  };

  const updateMemberRole = async (userId: string, newRole: string) => {
    if (!selectedTeam) return;
    try {
      await fetch(`/api/teams/${selectedTeam.id}/members`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole })
      });
      setMembers(members.map(m => m.user_id === userId ? { ...m, role: newRole } : m));
    } catch (err) {
      console.error('Update role error:', err);
    }
  };

  const removeMember = async (userId: string) => {
    if (!selectedTeam || !confirm('Remove this member from the team?')) return;
    try {
      await fetch(`/api/teams/${selectedTeam.id}/members`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      setMembers(members.filter(m => m.user_id !== userId));
    } catch (err) {
      console.error('Remove member error:', err);
    }
  };

  const cancelInvite = async (inviteId: string) => {
    if (!selectedTeam) return;
    try {
      await fetch(`/api/teams/${selectedTeam.id}/invite`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteId })
      });
      setInvites(invites.filter(i => i.id !== inviteId));
    } catch (err) {
      console.error('Cancel invite error:', err);
    }
  };

  const copyInviteLink = (invite: Invite) => {
    const url = invite.url || `${window.location.origin}/api/teams/join?token=${invite.token}`;
    navigator.clipboard.writeText(url);
    setCopied(invite.id);
    setTimeout(() => setCopied(null), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#D4A017] animate-spin" />
      </div>
    );
  }

  const canManage = userRole === 'owner' || userRole === 'admin';

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <header className="h-14 bg-[#1A1A1A] border-b border-white/10 flex items-center justify-between px-6">
        <Link href="/dashboard" className="flex items-center gap-2 text-white/60 hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <button onClick={() => setShowCreateTeam(true)} className="flex items-center gap-2 px-4 py-2 bg-[#D4A017] text-black rounded-lg hover:bg-[#B8860B]">
          <Plus className="w-4 h-4" /> Create Team
        </button>
      </header>

      <div className="flex">
        <aside className="w-64 bg-[#1A1A1A] border-r border-white/10 min-h-[calc(100vh-56px)]">
          <div className="p-4">
            <h2 className="text-sm font-medium text-white/50 uppercase tracking-wide mb-3">Your Teams</h2>
            {teams.length === 0 ? (
              <p className="text-white/40 text-sm">No teams yet</p>
            ) : (
              <div className="space-y-1">
                {teams.map(team => (
                  <button
                    key={team.id}
                    onClick={() => router.push(`/dashboard/team?id=${team.id}`)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition ${teamId === team.id ? 'bg-[#D4A017]/20 border border-[#D4A017]/50' : 'hover:bg-white/5'}`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#D4A017] to-[#B8860B] flex items-center justify-center text-black font-bold">
                      {team.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{team.name}</p>
                      <p className="text-xs text-white/50 capitalize">{team.role}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        <main className="flex-1 p-8">
          {!teamId || !selectedTeam ? (
            <div className="text-center py-20">
              <Building2 className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Select a Team</h2>
              <p className="text-white/50 mb-6">Choose a team from the sidebar or create a new one</p>
              <button onClick={() => setShowCreateTeam(true)} className="inline-flex items-center gap-2 px-6 py-3 bg-[#D4A017] text-black rounded-lg hover:bg-[#B8860B]">
                <Plus className="w-5 h-5" /> Create Your First Team
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#D4A017] to-[#B8860B] flex items-center justify-center text-black text-2xl font-bold">
                    {selectedTeam.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold">{selectedTeam.name}</h1>
                    <p className="text-white/50">{selectedTeam.member_count || members.length} members • {selectedTeam.credits} credits</p>
                  </div>
                </div>
                {canManage && (
                  <button onClick={() => setShowInvite(true)} className="flex items-center gap-2 px-4 py-2 bg-[#D4A017] text-black rounded-lg hover:bg-[#B8860B]">
                    <UserPlus className="w-4 h-4" /> Invite Members
                  </button>
                )}
              </div>

              <div className="bg-[#1A1A1A] rounded-xl border border-white/10 mb-6">
                <div className="p-4 border-b border-white/10">
                  <h2 className="font-semibold flex items-center gap-2"><Users className="w-5 h-5 text-[#D4A017]" /> Team Members</h2>
                </div>
                <div className="divide-y divide-white/5">
                  {members.map(member => {
                    const RoleIcon = roleIcons[member.role] || Eye;
                    return (
                      <div key={member.id} className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          {member.profiles.avatar_url ? (
                            <img src={member.profiles.avatar_url} alt="" className="w-10 h-10 rounded-full" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                              {(member.profiles.full_name || member.profiles.email).charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{member.profiles.full_name || 'Unnamed'}</p>
                            <p className="text-sm text-white/50">{member.profiles.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {canManage && member.role !== 'owner' ? (
                            <select value={member.role} onChange={(e) => updateMemberRole(member.user_id, e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm">
                              <option value="admin">Admin</option>
                              <option value="editor">Editor</option>
                              <option value="viewer">Viewer</option>
                            </select>
                          ) : (
                            <span className={`flex items-center gap-1.5 text-sm ${roleColors[member.role]}`}>
                              <RoleIcon className="w-4 h-4" /><span className="capitalize">{member.role}</span>
                            </span>
                          )}
                          {canManage && member.role !== 'owner' && member.user_id !== currentUserId && (
                            <button onClick={() => removeMember(member.user_id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {canManage && invites.length > 0 && (
                <div className="bg-[#1A1A1A] rounded-xl border border-white/10">
                  <div className="p-4 border-b border-white/10">
                    <h2 className="font-semibold flex items-center gap-2"><Mail className="w-5 h-5 text-[#D4A017]" /> Pending Invites</h2>
                  </div>
                  <div className="divide-y divide-white/5">
                    {invites.map(invite => (
                      <div key={invite.id} className="flex items-center justify-between p-4">
                        <div>
                          <p className="font-medium">{invite.email}</p>
                          <p className="text-sm text-white/50 capitalize">{invite.role} • Expires {new Date(invite.expires_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => copyInviteLink(invite)} className="p-2 hover:bg-white/5 rounded-lg">
                            {copied === invite.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                          </button>
                          <button onClick={() => cancelInvite(invite.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"><X className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {showCreateTeam && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1A1A] rounded-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Create New Team</h2>
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <input type="text" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} placeholder="Team name" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 mb-4" autoFocus />
            <div className="flex gap-3">
              <button onClick={() => setShowCreateTeam(false)} className="flex-1 px-4 py-2 border border-white/10 rounded-lg hover:bg-white/5">Cancel</button>
              <button onClick={createTeam} disabled={creating || !newTeamName.trim()} className="flex-1 px-4 py-2 bg-[#D4A017] text-black rounded-lg hover:bg-[#B8860B] disabled:opacity-50">
                {creating ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Create Team'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showInvite && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1A1A] rounded-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Invite Team Member</h2>
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="Email address" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 mb-4" autoFocus />
            <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 mb-4">
              <option value="admin">Admin - Can manage team & members</option>
              <option value="editor">Editor - Can create & edit listings</option>
              <option value="viewer">Viewer - Can only view listings</option>
            </select>
            <div className="flex gap-3">
              <button onClick={() => setShowInvite(false)} className="flex-1 px-4 py-2 border border-white/10 rounded-lg hover:bg-white/5">Cancel</button>
              <button onClick={sendInvite} disabled={inviting || !inviteEmail.trim()} className="flex-1 px-4 py-2 bg-[#D4A017] text-black rounded-lg hover:bg-[#B8860B] disabled:opacity-50">
                {inviting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Send Invite'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TeamPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#D4A017] animate-spin" /></div>}>
      <TeamPageContent />
    </Suspense>
  );
}
