import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { PageHeader } from '@/components/ui';
import {
  User as UserIcon, Mail, Phone, Shield, Camera, KeyRound, LogOut, Save, Loader2,
} from 'lucide-react';

export function ProfilePage() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [form, setForm] = useState({
    full_name: profile?.full_name ?? '',
    email: profile?.email ?? '',
    phone: profile?.phone ?? '',
  });
  const [busy, setBusy] = useState(false);
  const [pwd, setPwd] = useState({ current: '', next: '' });
  const [pwdMsg, setPwdMsg] = useState<string | null>(null);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    const { data } = await supabase.from('profiles').select('id').eq('user_id', user.id).maybeSingle();
    if (data) {
      await supabase.from('profiles').update({ ...form, updated_at: new Date().toISOString() }).eq('id', data.id);
    } else {
      await supabase.from('profiles').insert({ ...form, user_id: user.id, role: 'admin' });
    }
    await refreshProfile();
    setBusy(false);
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg(null);
    if (pwd.next.length < 6) { setPwdMsg('New password must be at least 6 characters.'); return; }
    const { error } = await supabase.auth.updateUser({ password: pwd.next });
    setPwdMsg(error ? error.message : 'Password updated successfully.');
    if (!error) setPwd({ current: '', next: '' });
  };

  const initials = (form.full_name || form.email || 'U').slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" subtitle="Manage your account details and password" />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Avatar card */}
        <div className="glass p-6 text-center">
          <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-aqua-400 to-aqua-600 text-3xl font-bold text-navy-950 shadow-lg shadow-aqua-500/30">
            {initials}
          </div>
          <button className="mx-auto flex items-center gap-2 text-sm text-aqua-300 hover:text-aqua-200">
            <Camera className="h-4 w-4" /> Change Photo
          </button>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-center gap-2 text-white/60"><Shield className="h-4 w-4 text-aqua-300" /> Role: <span className="font-medium text-white capitalize">{profile?.role ?? 'admin'}</span></div>
          </div>
          <button onClick={() => signOut()} className="btn-danger mt-6 w-full justify-center"><LogOut className="h-4 w-4" /> Logout</button>
        </div>

        {/* Details */}
        <form onSubmit={saveProfile} className="glass space-y-4 p-6 lg:col-span-2">
          <h3 className="font-semibold text-white">Account Details</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs text-white/50"><UserIcon className="h-3.5 w-3.5" /> Full Name</label>
              <input className="glass-input" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs text-white/50"><Mail className="h-3.5 w-3.5" /> Email</label>
              <input className="glass-input" value={form.email} disabled />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 flex items-center gap-1.5 text-xs text-white/50"><Phone className="h-3.5 w-3.5" /> Phone</label>
              <input className="glass-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91…" />
            </div>
          </div>
          <button type="submit" disabled={busy} className="btn-primary"><Save className="h-4 w-4" /> {busy ? 'Saving…' : 'Save Changes'}</button>
        </form>

        {/* Password */}
        <form onSubmit={changePassword} className="glass space-y-4 p-6 lg:col-span-3">
          <div className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-aqua-300" /><h3 className="font-semibold text-white">Change Password</h3></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs text-white/50">New Password</label>
              <input type="password" className="glass-input" value={pwd.next} onChange={(e) => setPwd({ ...pwd, next: e.target.value })} required minLength={6} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-white/50">Confirm New Password</label>
              <input type="password" className="glass-input" placeholder="Re-enter new password" />
            </div>
          </div>
          {pwdMsg && <div className={`rounded-xl px-4 py-2 text-sm ${pwdMsg.includes('success') ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-300'}`}>{pwdMsg}</div>}
          <button type="submit" className="btn-primary"><KeyRound className="h-4 w-4" /> Update Password</button>
        </form>
      </div>
    </div>
  );
}
