import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

export interface Profile {
  id: string;
  username: string;
  elo: number;
  coins: number;
  current_streak: number;
  longest_streak: number;
  last_played_date?: string | null;
  avatar_url?: string | null;
  unlocked_skins?: string[];
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
        console.error('Error fetching profile:', error.message || error, error);
        throw error;
      }

      if (!data) {
        console.log('Profile not found, creating new one...');
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: u.id,
            username: u.user_metadata.full_name || u.email?.split('@')[0] || 'Player',
            avatar_url: u.user_metadata.avatar_url || null,
            elo: 1200,
            coins: 0,
            current_streak: 0,
            longest_streak: 0,
            unlocked_skins: ['default']
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating profile:', insertError);
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
