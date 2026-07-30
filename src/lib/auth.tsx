import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile, SystemSettings } from '@/lib/types';

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  settings: SystemSettings | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

const DEFAULT_SETTINGS: SystemSettings = {
  id: '',
  user_id: '',
  safe_level: 30,
  caution_level: 50,
  warning_level: 70,
  danger_level: 85,
  rain_threshold: 5,
  refresh_interval: 5,
  dark_mode: true,
  language: 'en',
  updated_at: '',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (uid: string, email?: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('user_id', uid).maybeSingle();
    if (!data) {
      const { data: created } = await supabase
        .from('profiles')
        .insert({ user_id: uid, email: email ?? '', full_name: '', role: 'admin' })
        .select('*')
        .maybeSingle();
      setProfile(created as Profile | null);
    } else {
      setProfile(data as Profile);
    }
  };

  const loadSettings = async (uid: string) => {
    const { data } = await supabase.from('system_settings').select('*').eq('user_id', uid).maybeSingle();
    if (!data) {
      const { data: created } = await supabase
        .from('system_settings')
        .insert({ user_id: uid })
        .select('*')
        .maybeSingle();
      setSettings((created as SystemSettings) ?? DEFAULT_SETTINGS);
    } else {
      setSettings(data as SystemSettings);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        (async () => {
          await Promise.all([loadProfile(data.session!.user.id, data.session!.user.email), loadSettings(data.session!.user.id)]);
          setLoading(false);
        })();
      } else {
        setLoading(false);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        (async () => {
          await Promise.all([loadProfile(sess.user.id, sess.user.email), loadSettings(sess.user.id)]);
        })();
      } else {
        setProfile(null);
        setSettings(null);
      }
    });

    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) return { error: error.message };
    if (data.user) {
      await supabase.from('profiles').upsert({
        user_id: data.user.id,
        email,
        full_name: fullName,
        role: 'admin',
      });
    }
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSettings(null);
  };

  const refreshProfile = async () => {
    if (user) await loadProfile(user.id, user.email);
  };
  const refreshSettings = async () => {
    if (user) await loadSettings(user.id);
  };

  return (
    <AuthContext.Provider
      value={{ session, user, profile, settings, loading, signIn, signUp, signOut, refreshProfile, refreshSettings }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
