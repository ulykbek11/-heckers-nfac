import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

export interface Profile {
  id: string;
  username: string;
  elo: number;
  coins: number;
  streak_current: number;
  streak_max: number;
  last_played_at?: string | null;
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  fetchProfile: (u: User) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  
  fetchProfile: async (u: User) => {
    console.log('Fetching profile for user:', u.id);
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', u.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error.message, error.details, error.hint);
        throw error;
      }

      if (!data) {
        console.log('Profile not found, creating new one...');
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: u.id,
            username: u.user_metadata.full_name || u.email?.split('@')[0] || 'Player',
            elo: 1200,
            coins: 100,
            streak_current: 0,
            streak_max: 0
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating profile:', insertError.message, insertError.details, insertError.hint);
          throw insertError;
        }
        console.log('New profile created:', newProfile);
        set({ profile: newProfile });
      } else {
        console.log('Profile found:', data);
        set({ profile: data });
      }
    } catch (err) {
      console.error('Failed to sync profile:', err);
      // Even if profile fails, we have the user
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    set({ user: null, profile: null, loading: false });
  },
}));
