import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { PageHeader, LoadingSpinner, EmptyState, Badge } from '@/components/ui';
import { type NotificationRecord } from '@/lib/types';
import { Bell, MessageSquare, Phone, Mail, Smartphone, Search, Send } from 'lucide-react';

const TABS = [
  { key: 'all', label: 'All', icon: Bell },
  { key: 'sms', label: 'SMS Alerts', icon: MessageSquare },
  { key: 'voice', label: 'Voice Calls', icon: Phone },
  { key: 'push', label: 'Push Notifications', icon: Smartphone },
  { key: 'email', label: 'Email', icon: Mail },
] as const;

export function NotificationsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<typeof TABS[number]['key']>('all');
  const [search, setSearch] = useState('');
  const [sending, setSending] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('sent_at', { ascending: false });
    setItems((data as NotificationRecord[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const filtered = items.filter((n) => {
    if (tab !== 'all' && n.channel !== tab) return false;
    if (search && !`${n.recipient ?? ''} ${n.message ?? ''}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const sendTest = async () => {
    if (!user) return;
    setSending(true);
    await supabase.from('notifications').insert({
      user_id: user.id,
      channel: tab === 'all' ? 'sms' : tab,
      recipient: 'test@example.com',
      message: 'AquaSentinel test notification — system operational.',
      status: 'delivered',
      sent_at: new Date().toISOString(),
    });
    setSending(false);
    load();
  };

  if (loading) return <LoadingSpinner label="Loading notifications…" />;

  return (
    <div className="space-y-6">
      <PageHeader title="Notifications" subtitle="SMS, voice, push, and email alert delivery log"
        action={<button onClick={sendTest} disabled={sending} className="btn-primary"><Send className="h-4 w-4" /> Send Test</button>}
      />

      <div className="glass flex flex-wrap items-center gap-2 p-3">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition ${tab === t.key ? 'bg-aqua-500/20 text-aqua-200' : 'text-white/50 hover:bg-white/5'}`}>
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
        <div className="relative ml-auto">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input className="glass-input pl-10" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" message="Test alerts and real alerts will appear here." />
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => (
            <div key={n.id} className="glass flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-aqua-500/10 text-aqua-300">
                {n.channel === 'sms' ? <MessageSquare className="h-5 w-5" /> : n.channel === 'voice' ? <Phone className="h-5 w-5" /> : n.channel === 'push' ? <Smartphone className="h-5 w-5" /> : <Mail className="h-5 w-5" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{n.message}</p>
                <p className="text-xs text-white/40">{n.recipient} · {n.sent_at ? new Date(n.sent_at).toLocaleString() : 'Pending'}</p>
              </div>
              <Badge tone={n.status === 'delivered' ? 'emerald' : n.status === 'failed' ? 'red' : 'yellow'}>{n.status}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
