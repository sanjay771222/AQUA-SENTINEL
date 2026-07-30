import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { PageHeader, LoadingSpinner, EmptyState, Badge } from '@/components/ui';
import { type Profile } from '@/lib/types';
import { UserCog, Search, Trash2, KeyRound, Shield, Crown, Eye } from 'lucide-react';

const ROLE_META: Record<string, { label: string; icon: typeof Crown; tone: 'aqua' | 'emerald' | 'gray' }> = {
  admin: { label: 'Admin', icon: Crown, tone: 'aqua' },
  operator: { label: 'Operator', icon: Shield, tone: 'emerald' },
  viewer: { label: 'Viewer', icon: Eye, tone: 'gray' },
};

export function UsersPage() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = async () => {
    if (!user) return;
    // Note: RLS limits to own profile — admin scope would require service role / edge function
    const { data } = await supabase.from('profiles').select('*').eq('user_id', user.id);
    setProfiles((data as Profile[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const setRole = async (p: Profile, role: string) => {
    await supabase.from('profiles').update({ role, updated_at: new Date().toISOString() }).eq('id', p.id);
    load();
  };

  const resetPassword = async (email: string) => {
    await supabase.auth.resetPasswordForEmail(email);
    alert('Password reset email sent.');
  };

  const filtered = profiles.filter((p) => !search || `${p.full_name ?? ''} ${p.email ?? ''}`.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <LoadingSpinner label="Loading users…" />;

  return (
    <div className="space-y-6">
      <PageHeader title="User Management" subtitle="Manage user accounts, roles, and access" />

      <div className="glass flex items-center gap-3 p-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input className="glass-input pl-10" placeholder="Search users…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="glass p-4 text-sm text-white/50">
        <p>Role-based access control: <Badge tone="aqua">Admin</Badge> full access · <Badge tone="emerald">Operator</Badge> manage devices & alerts · <Badge tone="gray">Viewer</Badge> read-only.</p>
        <p className="mt-2 text-xs text-white/40">Note: For security, user management is scoped to your own account via Supabase RLS. To manage other users, deploy an admin edge function with the service role key.</p>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={UserCog} title="No users found" />
      ) : (
        <div className="glass overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-white/50">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((p) => {
                const role = ROLE_META[p.role] ?? ROLE_META.viewer;
                return (
                  <tr key={p.id} className="transition hover:bg-white/5">
                    <td className="px-4 py-3 font-medium text-white">{p.full_name || '—'}</td>
                    <td className="px-4 py-3 text-white/70">{p.email}</td>
                    <td className="px-4 py-3">
                      <select value={p.role} onChange={(e) => setRole(p, e.target.value)} className="glass-input py-1 text-xs">
                        <option value="admin">Admin</option>
                        <option value="operator">Operator</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-white/60">{p.phone || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <button onClick={() => resetPassword(p.email ?? '')} title="Reset Password" className="rounded-lg p-1.5 text-yellow-300 hover:bg-yellow-500/10"><KeyRound className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
