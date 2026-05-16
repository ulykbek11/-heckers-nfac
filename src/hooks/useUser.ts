'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  username: string;
  elo: number;
  coins: number;
  streak_current: number;
  avatar_url?: string | null;
}

export function useUser() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial session fetch
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) fetchProfile(user.id);
      else setLoading(false);
    });

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const u = session?.user ?? null;
        setUser(u);
        if (u) fetchProfile(u.id);
        else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, elo, coins, streak_current, avatar_url')
      .eq('id', userId)
      .maybeSingle();
    setProfile(data);
    setLoading(false);
  }

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { user, profile, loading, signOut };
}
