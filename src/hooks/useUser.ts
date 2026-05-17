'use client';

import { useCallback } from 'react';
import { useAuthStore } from '@/store/useAuthStore';

export function useUser() {
  const { user, profile, loading, signOut, fetchProfile } = useAuthStore();

  const refreshProfile = useCallback(() => {
    if (user) fetchProfile(user);
  }, [user, fetchProfile]);

  return { 
    user, 
    profile, 
    loading, 
    signOut, 
    refreshProfile
  };
}
