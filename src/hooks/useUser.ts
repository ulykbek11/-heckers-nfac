'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';

export function useUser() {
  const { user, profile, loading, setUser, setProfile, setLoading, fetchProfile, signOut } = useAuthStore();
  const supabase = createClient();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Initial session fetch
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        fetchProfile(u);
      } else {
        setLoading(false);
      }
    });

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const u = session?.user ?? null;
        setUser(u);
        if (u) {
          fetchProfile(u);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => {
      // We don't want to unsubscribe if we want it to be global, 
      // but usually hooks cleanup is good. 
      // However, if multiple components use this hook, they'll all register listeners.
      // Since it's a singleton client now, it's less of an issue, but still.
      subscription.unsubscribe();
      initialized.current = false;
    };
  }, [supabase.auth, setUser, fetchProfile, setLoading, setProfile]);

  return { 
    user, 
    profile, 
    loading, 
    signOut, 
    refreshProfile: () => user && fetchProfile(user) 
  };
}
