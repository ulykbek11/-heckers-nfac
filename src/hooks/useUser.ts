'use client';

import { useAuthStore } from '@/store/useAuthStore';

export function useUser() {
  const { user, profile, loading, signOut, fetchProfile } = useAuthStore();

  return { 
    user, 
    profile, 
    loading, 
    signOut, 
    refreshProfile: () => user && fetchProfile(user) 
  };
}
