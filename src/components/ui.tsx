import type { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

export function StatCard({
  icon: Icon,
  label,
  value,
  unit,
  accent = 'aqua',
  sub,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  unit?: string;
  accent?: 'aqua' | 'emerald' | 'yellow' | 'orange' | 'red' | 'navy';
  sub?: ReactNode;
}) {
  const accents: Record<string, string> = {
    aqua: 'text-aqua-300 bg-aqua-500/10',
    emerald: 'text-emerald-300 bg-emerald-500/10',
    yellow: 'text-yellow-300 bg-yellow-500/10',
    orange: 'text-orange-300 bg-orange-500/10',
    red: 'text-red-300 bg-red-500/10',
    navy: 'text-navy-200 bg-navy-500/10',
  };
  return (
    <div className="glass p-5 transition hover:scale-[1.02] hover:shadow-aqua-500/10">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-white/50">{label}</p>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-white">{value}</span>
            {unit && <span className="text-sm text-white/50">{unit}</span>}
          </div>
          {sub && <div className="mt-1 text-xs text-white/40">{sub}</div>}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accents[accent]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-white/50">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function LoadingSpinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-white/60">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-aqua-500/30 border-t-aqua-400" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, message }: { icon: LucideIcon; title: string; message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-white/50">
      <Icon className="h-12 w-12 opacity-40" />
      <div>
        <p className="font-medium text-white/70">{title}</p>
        {message && <p className="mt-1 text-sm">{message}</p>}
      </div>
    </div>
  );
}

export function Badge({ children, tone = 'aqua' }: { children: ReactNode; tone?: 'aqua' | 'emerald' | 'yellow' | 'orange' | 'red' | 'gray' }) {
  const tones: Record<string, string> = {
    aqua: 'bg-aqua-500/15 text-aqua-300 ring-aqua-500/30',
    emerald: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
    yellow: 'bg-yellow-500/15 text-yellow-300 ring-yellow-500/30',
    orange: 'bg-orange-500/15 text-orange-300 ring-orange-500/30',
    red: 'bg-red-500/15 text-red-300 ring-red-500/30',
    gray: 'bg-white/10 text-white/60 ring-white/20',
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${tones[tone]}`}>
      {children}
    </span>
  );
}
