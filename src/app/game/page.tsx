"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { useAppStore } from "@/store/useAppStore";
import { translations } from "@/lib/i18n";
import { createInitialBoard, getValidMoves, applyMove, getBestMove, Board, Move, Player, Piece } from "@/lib/checkers";
import { Clock, History as HistoryIcon, Flag, Crown, CheckCircle2, Lock, User, Bot, Copy, RefreshCcw, Coins, Play, Home } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/hooks/useUser";
import { createClient } from "@/lib/supabase/client";
import { useDataStore } from "@/store/useDataStore";

function GameContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lang, openAuthModal, setTopBarTitle, activeGameResignFn, setActiveGameResignFn, showConfirmModal } = useAppStore();
  const { user, profile, refreshProfile } = useUser();
  const { shopItems, setShopItems, lastFetched } = useDataStore();
  const t = translations[lang].game;
  const tLanding = translations[lang].landing;

  const [board, setBoard] = useState<Board>(createInitialBoard());
  const [currentPlayer, setCurrentPlayer] = useState<Player>('white');
  const [selectedCell, setSelectedCell] = useState<{r: number, c: number} | null>(null);
  const [validMoves, setValidMoves] = useState<Move[]>([]);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  
  const [whiteTime, setWhiteTime] = useState(5 * 60);
  const [blackTime, setBlackTime] = useState(5 * 60);
  const [gameStatus, setGameStatus] = useState<'playing' | 'white_won' | 'black_won' | 'draw'>('playing');

  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    const tParam = searchParams.get('timer');
    if (tParam) {
      if (tParam === '∞') {
        setWhiteTime(999 * 60);
        setBlackTime(999 * 60);
      } else {
        const mins = parseInt(tParam);
        if (!isNaN(mins)) {
          setWhiteTime(mins * 60);
          setBlackTime(mins * 60);
        }
      }
    }
  }, [searchParams]);

  // New states for interactions and animations
  const [chainState, setChainState] = useState<{
    piece: Piece;
    originalSquare: {r: number, c: number};
    currentSquare: {r: number, c: number};
    pathTaken: {r: number, c: number}[];
    moves: Move[];
  } | null>(null);

  const [aiAnimState, setAiAnimState] = useState<{
    originalSquare: {r: number, c: number};
    currentSquare: {r: number, c: number};
  } | null>(null);

  const [capturedIds, setCapturedIds] = useState<string[]>([]);
  const [flashSquare, setFlashSquare] = useState<{r: number, c: number} | null>(null);
  const [lastMoveSquares, setLastMoveSquares] = useState<{from: {r:number,c:number}, to: {r:number,c:number}} | null>(null);
  const [aiThinking, setAiThinking] = useState(false);
  
  const [surrenderReason, setSurrenderReason] = useState<string | null>(null);

  // Multiplayer states
  const [room, setRoom] = useState<any>(null);
  const [isHost, setIsHost] = useState(false);
  const [inputCode, setInputCode] = useState("");
  const [opponentProfile, setOpponentProfile] = useState<any>(null);
  const [multiplayerLoading, setMultiplayerLoading] = useState(false);


  const difficulty = searchParams.get('difficulty') || "Легко";
  const mode = searchParams.get('mode') || "ai";
  const aiDepth = difficulty === "Сложно" ? 6 : difficulty === "Средне" ? 4 : 2;
  const isBlackPlayer = mode === 'multiplayer' && !isHost;

  const handleGameOver = useCallback(async (winner: Player | 'draw', currentRoom?: any, isResign: boolean = false) => {
    const activeRoom = currentRoom || room;
    if (mode === 'multiplayer' && activeRoom) {
      // If we are the ones triggering the game over (e.g. resigning, winning move)
      updateMultiplayerBoard(board, currentPlayer, winner, isResign);
      
      // Update ELO if it's a matchmaking game
      if (activeRoom.timer != null && user && profile) {
        const supabase = createClient();
        const isWinner = winner === (isHost ? 'white' : 'black');
        const isDraw = winner === 'draw';
        const eloChange = isWinner ? 12 : (isDraw ? 0 : -8);
        
        await supabase.from('profiles').update({
          elo: (profile.elo || 1200) + eloChange
        }).eq('id', user.id);
        
        refreshProfile?.();
      }
      return;
    }
    if (mode !== 'ai' || !user || !profile) return;

    try {
      const supabase = createClient();
      
      const playerWon = winner === 'white';
      const isDraw = winner === 'draw';
      
      // Calculate reward
      let reward = 0;
      if (playerWon) {
        reward = difficulty === "Сложно" ? 100 : difficulty === "Средне" ? 75 : 50;
      }

      // Calculate ELO change
      const eloChange = playerWon ? 12 : (isDraw ? 0 : -8);

      // Save Game Record
      await supabase.from('games').insert({
        player_id: user.id,
        opponent: 'ai_' + (difficulty === 'Сложно' ? 'hard' : difficulty === 'Средне' ? 'medium' : 'easy'),
        winner: playerWon ? 'player' : (isDraw ? 'draw' : 'opponent'),
        mode: 'ai',
        difficulty: difficulty,
        moves: moveHistory,
        coins_earned: reward,
        elo_change: eloChange,
      });

      // Update Streak
      const today = new Date().toISOString().split('T')[0];
      const lastPlayed = profile.last_played_at;
      let newStreak = profile.streak_current || 0;

      if (lastPlayed !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastPlayed === yesterdayStr) {
          newStreak += 1;
        } else {
          newStreak = 1;
        }
      }

      const updates: any = {
        coins: (profile.coins || 0) + reward,
        elo: (profile.elo || 1200) + eloChange,
        streak_current: newStreak,
        last_played_at: today,
        streak_max: Math.max(newStreak, profile.streak_max || 0)
      };

      // Milestone rewards
      if ([3, 7, 14, 30].includes(newStreak) && lastPlayed !== today) {
        const coinMap: Record<number, number> = { 3: 0, 7: 200, 14: 500, 30: 1000 };
        updates.coins += coinMap[newStreak];
      }

      await supabase.from('profiles').update(updates).eq('id', user.id);
      refreshProfile?.();
      
      if (reward > 0) {
        (window as any).lastReward = reward;
      }
    } catch (err) {
      console.error('Error updating profile after game:', err);
    }
  }, [board, currentPlayer, difficulty, isHost, mode, moveHistory, profile, refreshProfile, room, user]);

  const playSound = useCallback((type: 'select' | 'move' | 'capture') => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === 'select') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } else if (type === 'move') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      } else if (type === 'capture') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (gameStatus === 'playing' && (mode === 'multiplayer' && room?.status === 'playing' || mode === 'ai')) {
        e.preventDefault();
        e.returnValue = ''; // Required for Chrome
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [gameStatus, mode, room]);

  useEffect(() => {
    if (gameStatus === 'playing' && ((mode === 'multiplayer' && room?.status === 'playing') || mode === 'ai')) {
      setActiveGameResignFn(async () => {
        const winner = (isHost || mode !== 'multiplayer' ? 'white' : 'black') === 'white' ? 'black' : 'white';
        setGameStatus(winner === 'white' ? 'white_won' : 'black_won');
        setSurrenderReason(lang === 'RU' ? 'Автоматическая сдача: покинул страницу' : 'Auto-surrender: left the page');
        await handleGameOver(winner, room, true);
      });
    } else {
      setActiveGameResignFn(null);
    }
    return () => setActiveGameResignFn(null);
  }, [gameStatus, mode, room, isHost, lang, setActiveGameResignFn, handleGameOver]);

  useEffect(() => {
    async function fetchItems() {
      if (shopItems && Date.now() - lastFetched.shopItems < 300000) return;
      try {
        const supabase = createClient();
        const { data, error } = await supabase.from("shop_items").select("*");
        if (!error && data) setShopItems(data);
      } catch (err) {}
    }
    fetchItems();
  }, [shopItems, lastFetched.shopItems, setShopItems]);

  useEffect(() => {
    const action = searchParams.get('action');
    const code = searchParams.get('code');
    const tParam = searchParams.get('timer');
    
    if (mode === 'multiplayer' && !room && !multiplayerLoading && user) {
      if (action === 'create') {
        createRoom(tParam);
      } else if (action === 'join' && code) {
        joinRoom(code);
      }
    }
  }, [mode, searchParams, room, multiplayerLoading, user]);

  // Multiplayer logic
  const createRoom = async (timerSetting?: string | null) => {
    if (!user) return openAuthModal();
    setMultiplayerLoading(true);
    try {
      const code = Math.random().toString(36).slice(2, 8).toUpperCase();
      const supabase = createClient();
      
      let initTime = 5 * 60;
      if (timerSetting) {
        if (timerSetting === '∞') initTime = 999 * 60;
        else initTime = parseInt(timerSetting) * 60;
      }
      
      console.log('Inserting room into DB...');
      const { data, error } = await supabase
        .from('game_rooms')
        .insert({
          code,
          host_id: user.id,
          board_state: { board: board, lastMove: null, history: [], whiteTime: initTime, blackTime: initTime },
          status: 'waiting',
          current_turn: 'white',
          timer_setting: timerSetting || '5 мин'
        })
        .select();

      if (error) {
        console.error('Supabase error creating room:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        throw new Error("No data returned after room creation");
      }

      setRoom(data[0]);
      setIsHost(true);
      console.log('Room created successfully:', data[0].code);
    } catch (err: any) {
      console.error('Error creating room:', err);
      alert(lang === 'RU' ? `Ошибка: ${err.message || "Не удалось создать комнату"}` : `Error: ${err.message || "Failed to create room"}`);
      router.push('/');
    } finally {
      setMultiplayerLoading(false);
    }
  };

  const joinRoom = async (code: string) => {
    if (!user) return openAuthModal();
    setMultiplayerLoading(true);
    try {
      const supabase = createClient();
      console.log('Searching for room code:', code);
      
      const { data, error } = await supabase
        .from('game_rooms')
        .select('*, host_profile:profiles!host_id(*)')
        .eq('code', code.toUpperCase());

      if (error) {
        console.error('Error finding room:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error(lang === 'RU' ? "Комната не найдена" : "Room not found");
      }

      const targetRoom = data[0];

      if (targetRoom.status === 'finished') {
        alert(lang === 'RU' ? "Эта игра уже завершена" : "This game is already finished");
        return;
      }

      if (targetRoom.host_id === user.id) {
         // Re-joining as host
         setRoom(targetRoom);
         setIsHost(true);
         setBoard(targetRoom.board_state);
         return;
      }

      console.log('Updating room status to playing...');
      const { data: updatedData, error: updateError } = await supabase
        .from('game_rooms')
        .update({ guest_id: user.id, status: 'playing' })
        .eq('id', targetRoom.id)
        .select();

      if (updateError) throw updateError;
      if (!updatedData || updatedData.length === 0) {
        throw new Error("Failed to update room status");
      }

      setRoom(updatedData[0]);
      setIsHost(false);
      const bs = updatedData[0].board_state;
      if (Array.isArray(bs)) {
        setBoard(bs);
      } else {
        setBoard(bs.board);
        if (bs.lastMove) setLastMoveSquares(bs.lastMove);
        if (bs.history) setMoveHistory(bs.history);
        if (bs.whiteTime !== undefined) setWhiteTime(bs.whiteTime);
        if (bs.blackTime !== undefined) setBlackTime(bs.blackTime);
      }
      setOpponentProfile(targetRoom.host_profile);
      console.log('Joined room as guest:', code);
    } catch (err: any) {
      console.error('Error joining room:', err);
      alert(err.message || (lang === 'RU' ? "Комната не найдена" : "Room not found"));
    } finally {
      setMultiplayerLoading(false);
    }
  };

  useEffect(() => {
    if (!room || mode !== 'multiplayer') return;

    const supabase = createClient();
    console.log('[Realtime] Subscribing to room:', room.code);

    const channel = supabase
      .channel(`room:${room.code}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'game_rooms',
        filter: `id=eq.${room.id}`
      }, async (payload: any) => {
        console.log('[Realtime] Update received for room:', payload);
        const newRoom = payload.new;
        setRoom(newRoom);
        const bs = newRoom.board_state;
        if (Array.isArray(bs)) {
          setBoard(bs);
        } else {
          setBoard(bs.board);
          if (bs.lastMove) setLastMoveSquares(bs.lastMove);
          if (bs.history) setMoveHistory(bs.history);
          if (bs.whiteTime !== undefined) setWhiteTime(bs.whiteTime);
          if (bs.blackTime !== undefined) setBlackTime(bs.blackTime);
        }
        setCurrentPlayer(newRoom.current_turn as Player);
        
        if (newRoom.status === 'playing') {
          const opponentId = isHost ? newRoom.guest_id : newRoom.host_id;
          if (opponentId) {
             const { data: prof } = await supabase.from('profiles').select('*').eq('id', opponentId).single();
             if (prof) setOpponentProfile(prof);
          }
        }

        if (newRoom.status === 'finished') {
          const finishedWinner = newRoom.winner === 'white' ? 'white_won' : (newRoom.winner === 'black' ? 'black_won' : 'draw');
          
          setGameStatus(prevStatus => {
            // Only update ELO if we haven't already processed the finish
            if (prevStatus === 'playing') {
               // Check if the opponent resigned (they sent 'finished' without a winning board state/move, meaning they resigned)
               const didOpponentResign = newRoom.winner === (isHost ? 'white' : 'black') && newRoom.resign === true;
               if (didOpponentResign) {
                 setSurrenderReason(lang === 'RU' ? 'Ваш соперник сдался' : 'Your opponent resigned');
               }

               if (newRoom.timer != null && user) {
                 const isWinner = newRoom.winner === (isHost ? 'white' : 'black');
                 const isDraw = newRoom.winner === 'draw';
                 const eloChange = isWinner ? 12 : (isDraw ? 0 : -8);
                 supabase.from('profiles').select('elo').eq('id', user.id).single().then(({data}: any) => {
                    if (data) {
                      supabase.from('profiles').update({
                         elo: (data.elo || 1200) + eloChange
                      }).eq('id', user.id).then(() => {
                         refreshProfile?.();
                      });
                    }
                 });
               }
            }
            return finishedWinner;
          });
        }
      })
      .subscribe((status: any) => {
        console.log(`[Realtime] Subscription status for room ${room.code}:`, status);
      });

    return () => {
      console.log('[Realtime] Unsubscribing from room:', room.code);
      supabase.removeChannel(channel);
    };
  }, [room?.id, room?.code, isHost, mode, user]);

  const updateMultiplayerBoard = async (newBoard: Board, nextTurn: Player, winner?: string, isResign?: boolean, newHistory?: string[], newLastMove?: any) => {
    if (!room || mode !== 'multiplayer') return;
    const supabase = createClient();
    console.log('[Multiplayer] Updating board in DB for room:', room.code, 'nextTurn:', nextTurn);
    
    const payload = {
      board: newBoard,
      lastMove: newLastMove !== undefined ? newLastMove : lastMoveSquares,
      history: newHistory !== undefined ? newHistory : moveHistory,
      whiteTime: whiteTime,
      blackTime: blackTime
    };

    const { error } = await supabase
      .from('game_rooms')
      .update({
        board_state: payload,
        current_turn: nextTurn,
        status: winner ? 'finished' : 'playing',
        winner: winner || null,
        ...(isResign !== undefined ? { resign: isResign } : {})
      })
      .eq('id', room.id);

    if (error) {
      console.error('[Multiplayer] Error updating board in DB:', error.message, '| Details:', error.details, '| Hint:', error.hint, '| Code:', error.code);
    } else {
      console.log('[Multiplayer] Board updated successfully in DB');
    }
  };

  const checkGameEnd = useCallback((currentBoard: Board, nextPlayer: Player) => {
    const nextMoves = getValidMoves(currentBoard, nextPlayer);
    if (nextMoves.length === 0) {
      const winner = nextPlayer === 'white' ? 'black_won' : 'white_won';
      setGameStatus(winner);
      handleGameOver(nextPlayer === 'white' ? 'black' : 'white');
    }
  }, [board, mode, user, profile]);

  function formatMove(move: Move) {
    const cols = 'ABCDEFGH';
    const from = `${cols[move.from.c]}${8 - move.from.r}`;
    const to = `${cols[move.to.c]}${8 - move.to.r}`;
    return `${from} ${move.captured && move.captured.length > 0 ? 'x' : '-'} ${to}`;
  }

  useEffect(() => {
    if (gameStatus !== 'playing') return;
    if (mode === 'multiplayer' && room?.status !== 'playing') return;

    const timer = setInterval(() => {
      if (currentPlayer === 'white') {
        setWhiteTime(prev => {
          if (prev <= 1) {
            setGameStatus('black_won');
            return 0;
          }
          return prev - 1;
        });
      } else {
        setBlackTime(prev => {
          if (prev <= 1) {
            setGameStatus('white_won');
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [currentPlayer, gameStatus, mode]);

  const animateAiMove = async (move: Move) => {
    setAiThinking(false);
    setAiAnimState({ originalSquare: move.from, currentSquare: move.from });

    const hops = move.path || [move.to];
    
    for (let i = 0; i < hops.length; i++) {
      const hop = hops[i];
      setAiAnimState(prev => ({ ...prev!, currentSquare: hop }));
      
      if (move.captured && move.captured[i]) {
         playSound('capture');
         const capR = move.captured[i].r;
         const capC = move.captured[i].c;
         const capPiece = board[capR][capC];
         if (capPiece) setCapturedIds(prev => [...prev, capPiece.id]);
      } else {
         playSound('move');
      }

      await new Promise(r => setTimeout(r, 220));
    }

    const newBoard = applyMove(board, move);
    setBoard(newBoard);
    setMoveHistory(prev => [...prev, formatMove(move)]);
    setLastMoveSquares({ from: move.from, to: move.to });
    setAiAnimState(null);
    setCapturedIds([]);
    setCurrentPlayer('white');
    checkGameEnd(newBoard, 'white');
  };

  useEffect(() => {
    if (mode === 'ai' && currentPlayer === 'black' && gameStatus === 'playing') {
      setTimeout(() => setAiThinking(true), 0);
      const timeout = setTimeout(() => {
        const bestMove = getBestMove(board, 'black', aiDepth);
        if (bestMove) {
          animateAiMove(bestMove);
        } else {
          setGameStatus('white_won');
          handleGameOver('white');
        }
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [currentPlayer, board, gameStatus, aiDepth, mode]);

  const validHops = useMemo(() => {
    if (chainState) {
      const hops = new Set<string>();
      chainState.moves.forEach(m => {
        const step = chainState.pathTaken.length;
        if (m.path && m.path[step]) {
           hops.add(`${m.path[step].r},${m.path[step].c}`);
        }
      });
      return Array.from(hops).map(h => ({r: parseInt(h.split(',')[0]), c: parseInt(h.split(',')[1])}));
    } else if (selectedCell) {
      const hops = new Set<string>();
      validMoves.forEach(m => {
        if (m.path && m.path.length > 0) {
           hops.add(`${m.path[0].r},${m.path[0].c}`);
        } else {
           hops.add(`${m.to.r},${m.to.c}`);
        }
      });
      return Array.from(hops).map(h => ({r: parseInt(h.split(',')[0]), c: parseInt(h.split(',')[1])}));
    }
    return [];
  }, [chainState, selectedCell, validMoves]);

  const handleCellClick = (r: number, c: number) => {
    if (gameStatus !== 'playing') return;
    if (mode === 'ai' && currentPlayer !== 'white') return;
    if (mode === 'multiplayer') {
      const myColor = isHost ? 'white' : 'black';
      if (currentPlayer !== myColor) return;
    }
    if (aiThinking || aiAnimState) return;

    if (chainState) {
      const hop = validHops.find(h => h.r === r && h.c === c);
      if (hop) {
        playSound('move');
        const newPathTaken = [...chainState.pathTaken, hop];
        
        const matchingMove = chainState.moves.find(m => m.path && m.path.length >= newPathTaken.length && m.path[newPathTaken.length - 1].r === hop.r && m.path[newPathTaken.length - 1].c === hop.c);
        
        if (matchingMove && matchingMove.captured && matchingMove.captured[newPathTaken.length - 1]) {
           playSound('capture');
           const capR = matchingMove.captured[newPathTaken.length - 1].r;
           const capC = matchingMove.captured[newPathTaken.length - 1].c;
           const capPiece = board[capR][capC];
           if (capPiece) setCapturedIds(prev => [...prev, capPiece.id]);
        }

        const completedMove = chainState.moves.find(m => m.path && m.path.length === newPathTaken.length && m.path.every((p, i) => p.r === newPathTaken[i].r && p.c === newPathTaken[i].c));
        
        setChainState(prev => ({ ...prev!, currentSquare: hop, pathTaken: newPathTaken }));
        
        if (completedMove) {
           setTimeout(() => {
             const newBoard = applyMove(board, completedMove);
             const newHistory = [...moveHistory, formatMove(completedMove)];
             const newLastMove = { from: completedMove.from, to: completedMove.to };
             setBoard(newBoard);
             setMoveHistory(newHistory);
             setLastMoveSquares(newLastMove);
             setChainState(null);
             setCapturedIds([]);
             const nextP = currentPlayer === 'white' ? 'black' : 'white';
             setCurrentPlayer(nextP);
             
             if (mode === 'multiplayer') {
               updateMultiplayerBoard(newBoard, nextP, undefined, undefined, newHistory, newLastMove);
             }
             
             checkGameEnd(newBoard, nextP);
           }, 220);
        } else {
           const nextMoves = chainState.moves.filter(m => m.path && m.path.length > newPathTaken.length && m.path[newPathTaken.length - 1].r === hop.r && m.path[newPathTaken.length - 1].c === hop.c);
           setChainState(prev => ({ ...prev!, moves: nextMoves }));
        }
      } else {
        setFlashSquare({r, c});
        setTimeout(() => setFlashSquare(null), 150);
      }
      return;
    }

    if (board[r][c]?.player === currentPlayer) {
      const allMoves = getValidMoves(board, currentPlayer);
      const pieceMoves = allMoves.filter(m => m.from.r === r && m.from.c === c);
      if (pieceMoves.length > 0) {
        playSound('select');
        setSelectedCell({ r, c });
        setValidMoves(pieceMoves);
      } else if (allMoves.some(m => m.captured && m.captured.length > 0)) {
        setFlashSquare({r, c});
        setTimeout(() => setFlashSquare(null), 150);
      } else {
        setSelectedCell({ r, c });
        setValidMoves([]);
      }
      return;
    }

    if (selectedCell) {
      const hop = validHops.find(h => h.r === r && h.c === c);
      if (hop) {
         playSound('move');
         const matchedMoves = validMoves.filter(m => 
            (m.path && m.path.length > 0 && m.path[0].r === r && m.path[0].c === c) ||
            (!m.path && m.to.r === r && m.to.c === c)
         );
         
         const move = matchedMoves[0];

         if (move.captured && move.captured[0]) {
           playSound('capture');
           const capR = move.captured[0].r;
           const capC = move.captured[0].c;
           const capPiece = board[capR][capC];
           if (capPiece) setCapturedIds(prev => [...prev, capPiece.id]);
         }

         setChainState({
            piece: board[selectedCell.r][selectedCell.c]!,
            originalSquare: selectedCell,
            currentSquare: hop,
            pathTaken: [hop],
            moves: matchedMoves
         });
         setSelectedCell(null);
         setValidMoves([]);

         if (matchedMoves.length === 1 && (!move.path || move.path.length === 1)) {
            setTimeout(() => {
              const newBoard = applyMove(board, move);
              const newHistory = [...moveHistory, formatMove(move)];
              const newLastMove = { from: move.from, to: move.to };
              setBoard(newBoard);
              setMoveHistory(newHistory);
              setLastMoveSquares(newLastMove);
              setChainState(null);
              setCapturedIds([]);
              const nextP = currentPlayer === 'white' ? 'black' : 'white';
              setCurrentPlayer(nextP);
              
              if (mode === 'multiplayer') {
                updateMultiplayerBoard(newBoard, nextP, undefined, undefined, newHistory, newLastMove);
              }
              
              checkGameEnd(newBoard, nextP);
            }, 220);
         }
      } else {
         setFlashSquare({r, c});
         setTimeout(() => setFlashSquare(null), 150);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const visualBoard = useMemo(() => {
    const newBoard = board.map(row => [...row]);
    if (chainState) {
      const piece = newBoard[chainState.originalSquare.r][chainState.originalSquare.c];
      newBoard[chainState.originalSquare.r][chainState.originalSquare.c] = null;
      newBoard[chainState.currentSquare.r][chainState.currentSquare.c] = piece;
    } else if (aiAnimState) {
      const piece = newBoard[aiAnimState.originalSquare.r][aiAnimState.originalSquare.c];
      newBoard[aiAnimState.originalSquare.r][aiAnimState.originalSquare.c] = null;
      newBoard[aiAnimState.currentSquare.r][aiAnimState.currentSquare.c] = piece;
    }
    return newBoard;
  }, [board, chainState, aiAnimState]);

  useEffect(() => {
    if (gameStatus !== 'playing' && user && !aiAnalysis && !isAnalyzing && moveHistory.length > 0) {
      const fetchAnalysis = async () => {
        setIsAnalyzing(true);
        try {
          const winnerStr = gameStatus === 'white_won' ? 'player' : gameStatus === 'black_won' ? 'opponent' : 'draw';
          const response = await fetch('/api/coach', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              moves: moveHistory,
              winner: winnerStr,
              difficulty: difficulty,
              moveCount: Math.ceil(moveHistory.length / 2)
            })
          });
          const data = await response.json();
          if (data.analysis) {
            setAiAnalysis(data.analysis);
          }
        } catch (err) {
          console.error("Failed to fetch AI analysis", err);
        } finally {
          setIsAnalyzing(false);
        }
      };
      fetchAnalysis();
    }
  }, [gameStatus, user, moveHistory, difficulty, aiAnalysis, isAnalyzing]);

  useEffect(() => {
    if (mode === 'multiplayer' && room?.status === 'waiting') {
      setTopBarTitle(`${translations[lang].game.roomCode}: ${room.code}`);
    } else {
      setTopBarTitle(mode === 'ai' ? t.gameVsAi : (lang === 'RU' ? 'Игра с другом' : 'Play with Friend'));
    }
  }, [setTopBarTitle, mode, t.gameVsAi, room, lang]);

  if (mode === 'multiplayer' && (multiplayerLoading || !room)) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center p-8 bg-[#F7F6F3]">
          <div className="w-full max-w-md space-y-8 bg-white p-8 md:p-10 rounded-2xl border border-[#EBEBEA] shadow-lg">
            {multiplayerLoading ? (
              <div className="text-center space-y-6 py-10">
                <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{lang === 'RU' ? 'Подключение...' : 'Connecting...'}</h2>
                  <p className="text-gray-500 mt-2">{lang === 'RU' ? 'Пожалуйста, подождите' : 'Please wait'}</p>
                </div>
              </div>
            ) : (
              <>
              {/* Create Room Block */}
              <div className="bg-white p-6 md:p-8 rounded-[16px] border border-[#EBEBEA] space-y-6">
                <h3 className="text-[16px] md:text-[18px] font-bold flex items-center gap-2">
                  <Play className="text-indigo-600" size={20} /> {translations[lang].game.createRoom}
                </h3>
                
                <div>
                  <h2 className="text-[13px] uppercase tracking-wider text-gray-400 font-semibold mb-3">
                    {translations[lang].landing.timer}
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {["3", "5", "10", "∞"].map((tValue) => (
                      <button
                        key={tValue}
                        onClick={() => {
                          const url = new URL(window.location.href);
                          url.searchParams.set('timer', tValue === "∞" ? tValue : `${tValue} мин`);
                          router.replace(url.toString());
                        }}
                        className={`h-[36px] px-4 rounded-[8px] text-[13px] font-semibold transition-all border ${
                          searchParams.get('timer') === (tValue === "∞" ? tValue : `${tValue} мин`) || (!searchParams.get('timer') && tValue === "5")
                            ? "bg-black text-white border-black" 
                            : "bg-gray-50 text-gray-700 border-[#EBEBEA] hover:bg-gray-100"
                        }`}
                      >
                        {tValue === "∞" ? tValue : `${tValue} ${translations[lang].landing.min}`}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => createRoom(searchParams.get('timer'))}
                  className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                >
                  <Play size={20} />
                  {t.createRoom}
                </button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#F7F6F3] px-4 text-gray-400 font-semibold">{lang === 'RU' ? 'ИЛИ' : 'OR'}</span></div>
              </div>

              <div className="bg-white p-6 md:p-8 rounded-[16px] border border-[#EBEBEA] space-y-6">
                <h3 className="text-[16px] md:text-[18px] font-bold flex items-center gap-2">
                  <User className="text-indigo-600" size={20} /> {translations[lang].game.joinRoom}
                </h3>
                <div className="space-y-3">
                  <div className="text-[11px] uppercase tracking-wider text-gray-400 font-bold ml-1">{t.enterCode}</div>
                  <input
                    type="text"
                    placeholder="ABCDEF"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                    className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all uppercase font-mono text-center text-2xl tracking-[0.2em]"
                    maxLength={6}
                  />
                  <button
                    onClick={() => joinRoom(inputCode)}
                    disabled={inputCode.length < 6}
                    className="w-full py-4 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-colors disabled:opacity-20 disabled:grayscale"
                  >
                    {t.joinRoom}
                  </button>
                </div>
              </div>
              </>
            )}
          </div>
        </main>
    );
  }

  if (mode === 'multiplayer' && room?.status === 'waiting') {
    return (
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 bg-[#F7F6F3]">
          <div className="w-full max-w-md text-center space-y-8 bg-white p-6 md:p-10 rounded-2xl border border-[#EBEBEA] shadow-lg">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <Clock size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{t.waitingOpponent}</h2>
              <p className="text-gray-500 mt-1">{translations[lang].game.shareCode}</p>
            </div>
            <div className="bg-indigo-50/50 p-6 md:p-8 rounded-2xl border-2 border-dashed border-indigo-200">
               <div className="text-[11px] uppercase tracking-[0.2em] text-indigo-400 font-bold mb-2">{translations[lang].game.roomCode}</div>
               <span className="text-3xl md:text-4xl font-black tracking-[0.3em] font-mono text-indigo-600">{room.code}</span>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(room.code);
                  alert(lang === 'RU' ? "Скопировано!" : "Copied!");
                }}
                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100"
              >
                <Copy size={18} />
                {t.copyCode}
              </button>
              <button
                onClick={() => setRoom(null)}
                className="w-full py-3 text-gray-400 hover:text-gray-600 text-sm font-medium transition-colors"
              >
                {t.cancel}
              </button>
            </div>
          </div>
        </main>
    );
  }

  return (
    <>
      <motion.main 
        className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden pb-20 md:pb-0"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        {/* Game Area */}
        <div className="flex-1 flex flex-col items-center justify-center bg-[#F7F6F3] p-4 md:p-8 overflow-y-auto">
          <div className="self-start flex items-center justify-between w-full mb-4 md:mb-8">
            <button 
              onClick={() => {
                if (activeGameResignFn) {
                  showConfirmModal({
                    title: lang === 'RU' ? "Сдаться и выйти?" : "Resign and leave?",
                    message: lang === 'RU' ? "Вы точно хотите покинуть текущую игру? Вам будет засчитано поражение." : "Are you sure you want to leave the current game? It will count as a loss.",
                    onConfirm: async () => {
                      await activeGameResignFn();
                      router.push("/");
                    }
                  });
                } else {
                  router.push("/");
                }
              }}
              className="px-3 py-1.5 md:px-4 md:py-2 bg-white border border-[#EBEBEA] rounded-[8px] text-[12px] md:text-[13px] font-semibold hover:bg-gray-50 transition-colors"
            >
              {t.back}
            </button>
            
            {mode === 'multiplayer' && (
              <div className={`px-4 py-1.5 md:px-6 md:py-2 rounded-full font-bold text-sm md:text-lg shadow-lg ${
                currentPlayer === (isHost ? 'white' : 'black') 
                  ? 'bg-green-500 text-white shadow-green-100' 
                  : 'bg-gray-200 text-gray-500 shadow-gray-100'
              }`}>
                {currentPlayer === (isHost ? 'white' : 'black') ? t.yourTurn : t.opponentTurn}
              </div>
            )}
          </div>
          
          {/* Board Container */}
          <div 
            className="w-full max-w-[560px] aspect-square border-[4px] md:border-[12px] border-[#D4C3A3] rounded-[4px] md:rounded-[8px] relative shadow-sm transition-transform duration-500"
            style={{ 
              transform: isBlackPlayer ? 'rotate(180deg)' : 'none',
              backgroundColor: shopItems?.find((i: any) => i.skin_key === profile?.active_skin)?.category === 'boards' 
                ? (shopItems?.find((i: any) => i.skin_key === profile?.active_skin)?.preview_colors?.[1] || '#8B7355')
                : '#8B7355'
            }}
          >
            
            {/* Background Grid */}
            <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 z-10">
              {board.map((row, r) => 
                row.map((_, c) => {
                  const isDark = (r + c) % 2 === 1;
                  const isValidHop = validHops.some(h => h.r === r && h.c === c);
                  const isFlash = flashSquare?.r === r && flashSquare?.c === c;
                  const isLastMove = lastMoveSquares && ((lastMoveSquares.from.r === r && lastMoveSquares.from.c === c) || (lastMoveSquares.to.r === r && lastMoveSquares.to.c === c));
                  
                  // Board skin logic
                  const activeSkinItem = shopItems?.find((i: any) => i.skin_key === profile?.active_skin);
                  const isBoardSkin = activeSkinItem?.category === 'boards';
                  const darkColor = isBoardSkin ? (activeSkinItem?.preview_colors?.[1] || '#8B7355') : '#8B7355';
                  const lightColor = isBoardSkin ? (activeSkinItem?.preview_colors?.[0] || '#E3D5C1') : '#E3D5C1';

                  return (
                    <div 
                      key={`bg-${r}-${c}`}
                      onClick={() => handleCellClick(r, c)}
                      className={`relative flex items-center justify-center cursor-pointer transition-colors duration-150
                        ${isFlash ? 'bg-red-400' : ''}
                        ${isLastMove ? 'after:absolute after:inset-0 after:bg-indigo-400/30' : ''}
                      `}
                      style={{ backgroundColor: isDark ? darkColor : lightColor }}
                    >
                      {isValidHop && (
                        chainState ? (
                          <div className="absolute w-4 h-4 md:w-6 md:h-6 rounded-full border-2 md:border-4 border-green-500 animate-ping opacity-75 z-10" />
                        ) : (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.15 }}
                            className="absolute w-2 h-2 md:w-4 md:h-4 rounded-full bg-[#6366F1]/60 z-10" 
                          />
                        )
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Pieces Area */}
            <div className="absolute inset-0 z-20 pointer-events-none">
              {visualBoard.flatMap((row, r) => 
                row.map((piece, c) => {
                  if (!piece) return null;
                  const isCaptured = capturedIds.includes(piece.id);
                  const isSelected = (selectedCell?.r === r && selectedCell?.c === c) || (chainState && chainState.currentSquare.r === r && chainState.currentSquare.c === c);
                  
                  const activeSkinItem = shopItems?.find((i: any) => i.skin_key === profile?.active_skin);
                  const isPieceSkin = activeSkinItem?.category === 'pieces';
                  
                  return (
                    <motion.div
                      key={piece.id}
                      className="absolute w-[12.5%] h-[12.5%] p-1 md:p-2 flex items-center justify-center"
                      initial={false}
                      animate={{ 
                        x: `${c * 100}%`, 
                        y: `${r * 100}%`,
                        scale: isCaptured ? 0 : 1,
                        opacity: isCaptured ? 0 : 1,
                        zIndex: isSelected ? 40 : 20,
                        rotate: isBlackPlayer ? 180 : 0
                      }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 300, 
                        damping: 25,
                        opacity: { duration: 0.2 }
                      }}
                    >
                      <div className={`relative w-full h-full rounded-full shadow-lg flex items-center justify-center transition-all duration-300
                        ${isSelected ? 'ring-4 ring-indigo-400 scale-110 shadow-indigo-200' : ''}
                      `} style={{
                        backgroundColor: piece.player === 'white' 
                          ? (isPieceSkin ? (activeSkinItem?.preview_colors?.[0] || '#F9F9F9') : '#F9F9F9')
                          : (isPieceSkin ? (activeSkinItem?.preview_colors?.[1] || '#1A1A1A') : '#1A1A1A')
                      }}>
                        {/* Piece Design */}
                        <div className="w-[80%] h-[80%] rounded-full border-2 md:border-4 opacity-20 border-black" />
                        
                        {piece.type === 'king' && (
                          <motion.div 
                            initial={{ scale: 0 }} 
                            animate={{ scale: 1 }}
                            className="absolute"
                          >
                            <Crown size={16} className={`md:w-6 md:h-6 ${piece.player === 'white' ? 'text-amber-500' : 'text-amber-400'}`} fill="currentColor" />
                          </motion.div>
                        )}

                        {/* Hover/Active Indicator */}
                        {piece.player === currentPlayer && !isSelected && (
                          <div className={`absolute -inset-1 rounded-full border-2 border-dashed opacity-40 animate-spin-slow
                             ${piece.player === 'white' ? 'border-indigo-600' : 'border-indigo-400'}
                          `} />
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Side Panel (Info & History) */}
        <div className="w-full lg:w-[320px] bg-white border-t lg:border-t-0 lg:border-l border-[#EBEBEA] flex flex-col flex-shrink-0">
          
          {/* Opponent Info */}
          <div className="p-4 md:p-6 flex items-center justify-between border-b border-[#EBEBEA]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-50 border border-[#EBEBEA] rounded-full flex items-center justify-center text-gray-400 overflow-hidden">
                {mode === 'ai' ? <Bot size={20} className="md:w-6 md:h-6" /> : <User size={20} className="md:w-6 md:h-6" />}
              </div>
              <div>
                <div className="font-semibold text-sm md:text-base">
                   {mode === 'ai' ? t.black : (mode === 'multiplayer' ? (opponentProfile?.username || '...') : t.black)}
                </div>
                <div className="text-[10px] md:text-[12px] text-gray-500">
                  {mode === 'ai' ? (difficulty === "Сложно" ? tLanding.hard : difficulty === "Средне" ? tLanding.medium : tLanding.easy) : (opponentProfile ? `${opponentProfile.elo} ${translations[lang].topbar.elo}` : '')}
                </div>
              </div>
            </div>
            <div className={`flex items-center gap-1 font-mono text-base md:text-[20px] font-semibold ${currentPlayer === 'black' ? 'text-black' : 'text-gray-400'}`}>
              <Clock size={14} className="md:w-4 md:h-4" /> {formatTime(blackTime)}
            </div>
          </div>

          {/* Move History */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col max-h-[120px] lg:max-h-none">
            <div className="flex items-center gap-2 text-[11px] md:text-[13px] font-semibold text-gray-400 uppercase tracking-wider mb-4">
              <HistoryIcon size={14} className="md:w-4 md:h-4" />
              {t.history}
              {aiThinking && (
                <span className="ml-2 flex gap-1">
                  <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0 }} className="w-1 h-1 bg-gray-400 rounded-full" />
                  <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }} className="w-1 h-1 bg-gray-400 rounded-full" />
                  <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.4 }} className="w-1 h-1 bg-gray-400 rounded-full" />
                </span>
              )}
            </div>
            
            <div className="space-y-1">
              {Array.from({ length: Math.ceil(moveHistory.length / 2) }).map((_ , i) => (
                <div key={i} className="flex text-[12px] md:text-[14px]">
                  <div className="w-6 md:w-8 text-gray-400 font-mono">{i + 1}.</div>
                  <div className="flex-1 font-mono">{moveHistory[i * 2]}</div>
                  <div className="flex-1 font-mono text-gray-500">{moveHistory[i * 2 + 1] || ''}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Player Info */}
          <div className="p-4 md:p-6 border-t border-[#EBEBEA] flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-white border border-[#EBEBEA] rounded-full flex items-center justify-center text-gray-600 overflow-hidden">
                <User size={20} className="md:w-6 md:h-6" />
              </div>
              <div>
                <div className="font-semibold text-sm md:text-base">
                  {profile?.username || t.white}
                </div>
                {currentPlayer === (isHost || mode !== 'multiplayer' ? 'white' : 'black') && (
                  <div className="text-[10px] md:text-[12px] text-[#6366F1] font-semibold">{t.yourTurn}</div>
                )}
              </div>
            </div>
            <div className={`flex items-center gap-1 font-mono text-base md:text-[20px] font-semibold ${currentPlayer === (isHost || mode !== 'multiplayer' ? 'white' : 'black') ? 'text-black' : 'text-gray-400'}`}>
              <Clock size={14} className="md:w-4 md:h-4" /> {formatTime(isHost || mode !== 'multiplayer' ? whiteTime : blackTime)}
            </div>
          </div>

          <div className="p-4 md:p-6 pt-0">
            <button
                onClick={() => {
                  const winner = (isHost || mode !== 'multiplayer' ? 'white' : 'black') === 'white' ? 'black' : 'white';
                  setGameStatus(winner === 'white' ? 'white_won' : 'black_won');
                  handleGameOver(winner, room, true);
                }}
                disabled={gameStatus !== 'playing'}
                className="w-full py-2 md:py-3 rounded-[8px] border border-[#EBEBEA] text-[12px] md:text-[14px] font-semibold hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Flag size={14} className="md:w-4 md:h-4" />
                {t.resign}
              </button>
          </div>
        </div>
      </motion.main>

      <AnimatePresence>
        {gameStatus !== 'playing' && (
          <motion.div 
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <motion.div 
              className="bg-white rounded-[16px] w-full max-w-[460px] overflow-hidden shadow-xl"
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              <div className="p-8 text-center border-b border-[#EBEBEA]">
                <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4
                  ${(gameStatus === 'white_won' && (isHost || mode !== 'multiplayer')) || (gameStatus === 'black_won' && !isHost && mode === 'multiplayer') || (mode === 'multiplayer' && surrenderReason === t.opponentResigned) ? 'bg-green-100 text-green-600' : 
                    gameStatus === 'draw' ? 'bg-gray-100 text-gray-600' : 'bg-red-100 text-red-600'}
                `}>
                  {((gameStatus === 'white_won' && (isHost || mode !== 'multiplayer')) || (gameStatus === 'black_won' && !isHost && mode === 'multiplayer') || (mode === 'multiplayer' && surrenderReason === t.opponentResigned)) ? <Crown size={32} /> : 
                   gameStatus === 'draw' ? <CheckCircle2 size={32} /> : <Flag size={32} />}
                </div>
                <h2 className="text-[24px] font-bold mb-2">
                  {((gameStatus === 'white_won' && (isHost || mode !== 'multiplayer')) || (gameStatus === 'black_won' && !isHost && mode === 'multiplayer') || (mode === 'multiplayer' && surrenderReason === t.opponentResigned)) ? t.youWon : 
                   gameStatus === 'draw' ? t.draw : (mode === 'multiplayer' ? t.opponentWon : t.aiWon)}
                </h2>
                {surrenderReason && (
                  <div className="text-red-500 text-sm font-semibold mb-4 bg-red-50 p-2 rounded-lg border border-red-100">
                    {surrenderReason}
                  </div>
                )}
                <div className="flex justify-center gap-6 text-[14px] text-gray-500">
                  <div><strong className="text-black">{Math.ceil(moveHistory.length / 2)}</strong> {t.moves}</div>
                  <div><strong className="text-black">{formatTime(5 * 60 - whiteTime)}</strong> {t.time}</div>
                </div>
              </div>

              <div className="p-8 bg-gray-50 text-center relative max-h-[300px] overflow-y-auto">
                {user ? (
                  <>
                    {isAnalyzing && (
                      <div style={{
                        background: '#f5f3ef',
                        borderRadius: 12,
                        padding: 16,
                        marginTop: 16,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                        textAlign: 'left'
                      }}>
                        <div style={{ fontSize: 11, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                          Анализирую партию...
                        </div>
                        {[1,2,3].map(i => (
                          <div key={i} style={{
                            height: 14,
                            borderRadius: 6,
                            background: '#e5e2dc',
                            width: i === 3 ? '60%' : '100%',
                            animation: 'pulse 1.5s infinite'
                          }} />
                        ))}
                      </div>
                    )}

                    {!isAnalyzing && aiAnalysis && (
                      <div style={{
                        background: '#f5f3ef',
                        borderRadius: 12,
                        padding: 16,
                        marginTop: 16,
                        textAlign: 'left'
                      }}>
                        <div style={{
                          fontSize: 11,
                          color: '#aaa',
                          textTransform: 'uppercase',
                          letterSpacing: '0.8px',
                          marginBottom: 10
                        }}>
                          AI Разбор партии
                        </div>
                        <div style={{
                          fontSize: 14,
                          color: '#444',
                          lineHeight: 1.7,
                          whiteSpace: 'pre-wrap'
                        }}>
                          {aiAnalysis}
                        </div>
                      </div>
                    )}

                    {!isAnalyzing && !aiAnalysis && (
                      <div className="text-gray-500 text-sm mt-4">Разбор недоступен</div>
                    )}
                  </>
                ) : (
                  <>
                    <h3 className="text-[16px] font-semibold mb-2 flex items-center justify-center gap-2">
                      <Lock size={16} className="text-indigo-600" />
                      {t.unlockAnalysis}
                    </h3>
                    <p className="text-[13px] text-gray-500 mb-6">
                      {t.analysisSub}
                    </p>
                    <button 
                      onClick={() => openAuthModal()}
                      className="w-full py-3 bg-black text-white rounded-[12px] text-[14px] font-bold hover:bg-gray-800 active:scale-[0.98] transition-all shadow-lg shadow-gray-200"
                    >
                      {t.registerAnalysis}
                    </button>
                  </>
                )}
              </div>

              <div className="p-4 bg-white border-t border-[#EBEBEA]">
                <button 
                  onClick={() => {
                    if (mode === 'multiplayer') {
                       router.push('/');
                    } else {
                       setBoard(createInitialBoard());
                       setMoveHistory([]);
                       setWhiteTime(5 * 60);
                       setBlackTime(5 * 60);
                       setCurrentPlayer('white');
                       setGameStatus('playing');
                       setSelectedCell(null);
                       setValidMoves([]);
                       setAiAnalysis(null);
                       setSurrenderReason(null);
                    }
                  }}
                  className="w-full py-3 bg-gray-100 text-gray-700 rounded-[12px] text-[14px] font-bold hover:bg-gray-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  {mode === 'multiplayer' ? (
                    <>
                      <Home size={16} />
                      {lang === 'RU' ? 'На главную' : 'Home'}
                    </>
                  ) : (
                    <>
                      <RefreshCcw size={16} />
                      {t.playAgain}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function GamePage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>}>
      <GameContent />
    </Suspense>
  );
}
