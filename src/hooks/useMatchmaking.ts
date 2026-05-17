import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { createInitialBoard } from '@/lib/checkers';

export interface MatchmakingState {
  isSearching: boolean;
  searchTime: number;
  opponentFound: boolean;
  opponentData: { username: string; elo: number; avatar_url: string | null } | null;
  roomCode: string | null;
  currentEloRange: number;
}

export function useMatchmaking() {
  const [state, setState] = useState<MatchmakingState>({
    isSearching: false,
    searchTime: 0,
    opponentFound: false,
    opponentData: null,
    roomCode: null,
    currentEloRange: 150,
  });

  const router = useRouter();
  const queueIdRef = useRef<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const currentTimerRef = useRef<number>(300);

  // Helper to calculate ELO range based on search time
  const getEloRange = (seconds: number) => {
    if (seconds <= 30) return 150;
    if (seconds <= 60) return 300;
    if (seconds <= 90) return 500;
    return 9999; // effectively no limit
  };

  const startSearch = async (userId: string, elo: number | undefined | null, timerSeconds: number) => {
    if (state.isSearching) return;

    const supabase = createClient();
    setState(prev => ({ ...prev, isSearching: true, searchTime: 0, currentEloRange: 150 }));
    startTimeRef.current = Date.now();
    currentTimerRef.current = timerSeconds;

    // Handle "infinity" timer where timerSeconds might be NaN
    const validTimerSeconds = isNaN(timerSeconds) ? 999999 : timerSeconds;

    const safeElo = elo || 1200; // Fallback to 1200 if elo is missing

    try {
      // 1. Insert into queue
      const { data: queueData, error: insertError } = await supabase
        .from('matchmaking_queue')
        .insert({
          player_id: userId,
          elo: safeElo,
          timer: validTimerSeconds,
          status: 'searching'
        })
        .select('id, created_at')
        .single();

      if (insertError) throw insertError;
      
      queueIdRef.current = queueData.id;
      const myCreatedAt = new Date(queueData.created_at).getTime();

      // 2. Start polling
      intervalRef.current = setInterval(async () => {
        const currentSearchTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const currentRange = getEloRange(currentSearchTime);
        
        setState(prev => ({ 
          ...prev, 
          searchTime: currentSearchTime,
          currentEloRange: currentRange
        }));

        // First, check if we've been matched by someone else
        const { data: me } = await supabase
          .from('matchmaking_queue')
          .select('status, room_code')
          .eq('id', queueIdRef.current)
          .single();

        console.log('My queue status:', me?.status, 'Room:', me?.room_code);

        if (me && me.status === 'matched' && me.room_code) {
          const { data: roomData } = await supabase
            .from('game_rooms')
            .select('host_id, guest_id')
            .eq('code', me.room_code)
            .single();

          if (roomData) {
            const oppId = roomData.host_id === userId ? roomData.guest_id : roomData.host_id;
            handleMatchFound(me.room_code, oppId as string);
          }
          return;
        }

        console.log('Searching...', { userId, elo: safeElo, timer: validTimerSeconds, eloRange: currentRange });

        // If not matched, look for an opponent
        const minElo = safeElo - currentRange;
        const maxElo = safeElo + currentRange;

        const { data: opponents } = await supabase
          .from('matchmaking_queue')
          .select('id, player_id, created_at')
          .eq('status', 'searching')
          .eq('timer', validTimerSeconds)
          .neq('player_id', userId.toString())
          .gte('elo', minElo)
          .lte('elo', maxElo)
          .order('created_at', { ascending: true })
          .limit(1);

        if (opponents && opponents.length > 0) {
          const opponent = opponents[0];
          console.log('Found opponent:', opponent);

          const newRoomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
          
          // First, attempt to update BOTH to matched.
          // Due to RLS or race conditions, this acts as an atomic lock if RLS is configured correctly.
          // The first one to successfully update both rows to 'matched' wins the right to create the room.
          const { error: updateError } = await supabase
            .from('matchmaking_queue')
            .update({ status: 'matched', room_code: newRoomCode })
            .in('player_id', [userId.toString(), opponent.player_id.toString()])
            .eq('status', 'searching'); // Ensure we only update if they are still searching

          if (updateError) {
            console.log('Failed to lock opponents, likely already matched:', updateError);
            return; // Already matched by another process
          }

          // We successfully locked both players, now create the game room
          const { error: roomError } = await supabase
            .from('game_rooms')
            .insert({
              code: newRoomCode,
              host_id: userId,
              guest_id: opponent.player_id,
              board_state: createInitialBoard() as any, // Initial state will be handled by game page
              timer: validTimerSeconds,
              timer_setting: isNaN(timerSeconds) ? '∞' : `${Math.floor(validTimerSeconds / 60)} мин`,
              status: 'playing', // Auto start for now
            });

          if (!roomError) {
            handleMatchFound(newRoomCode, opponent.player_id);
          } else {
            console.error('Failed to create room:', roomError.message, roomError.details, roomError);
            // Fallback: unlock them if room creation failed? 
            // In a real app we'd revert, but for now we'll just log
          }
        }
      }, 1000);

    } catch (error: any) {
      console.error('Matchmaking error:', error?.message || error);
      alert('Ошибка поиска: ' + (error?.message || JSON.stringify(error)));
      cancelSearch();
    }
  };

  const handleMatchFound = async (roomCode: string, opponentId: string) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const supabase = createClient();
    // Fetch opponent profile details
    const { data: opponentProfile } = await supabase
      .from('profiles')
      .select('username, elo, avatar_url')
      .eq('id', opponentId)
      .single();

    setState(prev => ({
      ...prev,
      opponentFound: true,
      roomCode,
      opponentData: opponentProfile
    }));

    // Allow UI to show "Match found!" for a few seconds before redirect
    setTimeout(() => {
      const timerStr = isNaN(currentTimerRef.current) || currentTimerRef.current === 999999 ? '∞' : currentTimerRef.current === 180 ? '3 мин' : currentTimerRef.current === 600 ? '10 мин' : '5 мин';
      router.push(`/game?mode=multiplayer&action=join&code=${roomCode}&timer=${encodeURIComponent(timerStr)}`);
    }, 3000);
  };

  const cancelSearch = async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (queueIdRef.current) {
      const supabase = createClient();
      await supabase
        .from('matchmaking_queue')
        .update({ status: 'canceled' })
        .eq('id', queueIdRef.current);
      queueIdRef.current = null;
    }

    setState({
      isSearching: false,
      searchTime: 0,
      opponentFound: false,
      opponentData: null,
      roomCode: null,
      currentEloRange: 150,
    });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (queueIdRef.current) {
        // Fire and forget cancellation
        const supabase = createClient();
        supabase.from('matchmaking_queue')
          .update({ status: 'canceled' })
          .eq('id', queueIdRef.current)
          .then();
      }
    };
  }, []);

  return {
    ...state,
    startSearch,
    cancelSearch
  };
}
