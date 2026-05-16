"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { useAppStore } from "@/store/useAppStore";
import { translations } from "@/lib/i18n";
import { createInitialBoard, getValidMoves, applyMove, getBestMove, Board, Move, Player, Piece } from "@/lib/checkers";
import { Clock, History as HistoryIcon, Flag, Crown, CheckCircle2, Lock, User, Bot, Copy, RefreshCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/hooks/useUser";

function GameContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lang, openAuthModal, setTopBarTitle } = useAppStore();
  const { user, profile, refreshProfile } = useUser();
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
  
  // Multiplayer states
  const [room, setRoom] = useState<any>(null);
  const [isHost, setIsHost] = useState(false);
  const [inputCode, setInputCode] = useState("");
  const [opponentProfile, setOpponentProfile] = useState<any>(null);
  const [multiplayerLoading, setMultiplayerLoading] = useState(false);


  const difficulty = searchParams.get('difficulty') || "Легко";
  const mode = searchParams.get('mode') || "ai";
  const aiDepth = difficulty === "Сложно" ? 6 : difficulty === "Средне" ? 4 : 2;

  const handleGameOver = async (winner: Player | 'draw') => {
    if (mode !== 'ai' || !user || !profile) return;

    try {
      const { createClient } = await import('@/lib/supabase/client');
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
      const lastPlayed = profile.last_played_date;
      let newStreak = profile.current_streak || 0;

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
        current_streak: newStreak,
        last_played_date: today,
        longest_streak: Math.max(newStreak, profile.longest_streak || 0)
      };

      // Milestone rewards
      if ([3, 7, 14, 30].includes(newStreak) && lastPlayed !== today) {
        const skinMap: Record<number, string> = { 3: 'gold', 7: 'fire', 14: 'diamond', 30: 'legend' };
        const coinMap: Record<number, number> = { 3: 0, 7: 200, 14: 500, 30: 1000 };
        updates.coins += coinMap[newStreak];
        if (skinMap[newStreak]) {
           updates.unlocked_skins = [...(profile.unlocked_skins || []), skinMap[newStreak]];
        }
      }

      await supabase.from('profiles').update(updates).eq('id', user.id);
      refreshProfile?.();
      
      if (reward > 0) {
        (window as any).lastReward = reward;
      }
    } catch (err) {
      console.error('Error updating profile after game:', err);
    }
  };

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
    const action = searchParams.get('action');
    const code = searchParams.get('code');
    const tParam = searchParams.get('timer');
    
    if (mode === 'multiplayer' && !room && !multiplayerLoading) {
      if (action === 'create') {
        createRoom(tParam);
      } else if (action === 'join' && code) {
        joinRoom(code);
      }
    }
  }, [mode, searchParams, room, multiplayerLoading]);

  // Multiplayer logic
  const createRoom = async (timerSetting?: string | null) => {
    if (!user) return openAuthModal();
    setMultiplayerLoading(true);
    try {
      const code = Math.random().toString(36).slice(2, 8).toUpperCase();
      const supabase = (await import('@/lib/supabase/client')).createClient();
      const { data, error } = await supabase
        .from('game_rooms')
        .insert({
          code,
          host_id: user.id,
          board_state: board,
          status: 'waiting',
          current_turn: 'white',
          timer_setting: timerSetting || '5 мин'
        })
        .select()
        .single();

      if (error) throw error;
      setRoom(data);
      setIsHost(true);
    } catch (err) {
      console.error('Error creating room:', err);
    } finally {
      setMultiplayerLoading(false);
    }
  };

  const joinRoom = async (code: string) => {
    if (!user) return openAuthModal();
    setMultiplayerLoading(true);
    try {
      const supabase = (await import('@/lib/supabase/client')).createClient();
      const { data, error } = await supabase
        .from('game_rooms')
        .select('*, host_profile:profiles!host_id(*)')
        .eq('code', code.toUpperCase())
        .single();

      if (error) throw error;
      if (data.status === 'finished') {
        alert(lang === 'RU' ? "Эта игра уже завершена" : "This game is already finished");
        return;
      }

      const { data: updatedRoom, error: updateError } = await supabase
        .from('game_rooms')
        .update({ guest_id: user.id, status: 'playing' })
        .eq('id', data.id)
        .select()
        .single();

      if (updateError) throw updateError;
      setRoom(updatedRoom);
      setIsHost(false);
      setBoard(updatedRoom.board_state);
      setOpponentProfile(data.host_profile);
    } catch (err) {
      console.error('Error joining room:', err);
      alert(lang === 'RU' ? "Комната не найдена" : "Room not found");
    } finally {
      setMultiplayerLoading(false);
    }
  };

  useEffect(() => {
    if (!room || mode !== 'multiplayer') return;

    const setupRealtime = async () => {
      const supabase = (await import('@/lib/supabase/client')).createClient();
      const channel = supabase
        .channel(`room:${room.code}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'game_rooms',
          filter: `id=eq.${room.id}`
        }, async (payload) => {
          const newRoom = payload.new;
          setRoom(newRoom);
          setBoard(newRoom.board_state);
          setCurrentPlayer(newRoom.current_turn as Player);
          
          if (newRoom.status === 'playing' && !opponentProfile) {
            const opponentId = isHost ? newRoom.guest_id : newRoom.host_id;
            if (opponentId) {
               const { data: prof } = await supabase.from('profiles').select('*').eq('id', opponentId).single();
               setOpponentProfile(prof);
            }
          }

          if (newRoom.status === 'finished') {
            setGameStatus(newRoom.winner === 'white' ? 'white_won' : (newRoom.winner === 'black' ? 'black_won' : 'draw'));
          }
        })
        .subscribe();

      return channel;
    };

    let channel: any;
    setupRealtime().then(c => channel = c);

    return () => {
      if (channel) {
        import('@/lib/supabase/client').then(({ createClient }) => {
          createClient().removeChannel(channel);
        });
      }
    };
  }, [room, isHost, opponentProfile, mode]);

  const updateMultiplayerBoard = async (newBoard: Board, nextTurn: Player, winner?: string) => {
    if (!room || mode !== 'multiplayer') return;
    const supabase = (await import('@/lib/supabase/client')).createClient();
    await supabase
      .from('game_rooms')
      .update({
        board_state: newBoard,
        current_turn: nextTurn,
        status: winner ? 'finished' : 'playing',
        winner: winner || null
      })
      .eq('id', room.id);
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
  }, [currentPlayer, gameStatus]);

  useEffect(() => {
    if (mode === 'ai' && currentPlayer === 'black' && gameStatus === 'playing') {
      setAiThinking(true);
      const timeout = setTimeout(() => {
        const bestMove = getBestMove(board, 'black', aiDepth);
        if (bestMove) {
          animateAiMove(bestMove);
        } else {
          setGameStatus('white_won');
          handleGameOver('white');
        }
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [currentPlayer, board, gameStatus, aiDepth, mode]);

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
             setBoard(newBoard);
             setMoveHistory(prev => [...prev, formatMove(completedMove)]);
             setLastMoveSquares({ from: completedMove.from, to: completedMove.to });
             setChainState(null);
             setCapturedIds([]);
             const nextP = currentPlayer === 'white' ? 'black' : 'white';
             setCurrentPlayer(nextP);
             
             if (mode === 'multiplayer') {
               updateMultiplayerBoard(newBoard, nextP);
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
              setBoard(newBoard);
              setMoveHistory(prev => [...prev, formatMove(move)]);
              setLastMoveSquares({ from: move.from, to: move.to });
              setChainState(null);
              setCapturedIds([]);
              const nextP = currentPlayer === 'white' ? 'black' : 'white';
              setCurrentPlayer(nextP);
              
              if (mode === 'multiplayer') {
                updateMultiplayerBoard(newBoard, nextP);
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
    setTopBarTitle(mode === 'ai' ? t.gameVsAi : t.chooseMode);
  }, [setTopBarTitle, mode, t.gameVsAi, t.chooseMode]);

  if (mode === 'multiplayer' && !room) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center p-8 bg-[#F7F6F3]">
          <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-2xl border border-[#EBEBEA] shadow-sm">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">{t.createRoom}</h2>
              <p className="text-gray-500 mt-2">{t.waitingOpponent}</p>
            </div>

            <div className="space-y-4">
              <button
                onClick={createRoom}
                disabled={multiplayerLoading}
                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-50"
              >
                {multiplayerLoading ? "..." : t.createRoom}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-400">ИЛИ</span></div>
              </div>

              <div className="space-y-2">
                <input
                  type="text"
                  placeholder={t.enterCode}
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all uppercase font-mono text-center text-lg"
                />
                <button
                  onClick={() => joinRoom(inputCode)}
                  disabled={multiplayerLoading || inputCode.length < 6}
                  className="w-full py-3 bg-white text-gray-900 border border-gray-200 rounded-xl font-bold hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  {t.joinRoom}
                </button>
              </div>
            </div>
          </div>
        </main>

    );
  }

  if (mode === 'multiplayer' && room?.status === 'waiting') {
    return (
      <main className="flex-1 flex flex-col items-center justify-center p-8 bg-[#F7F6F3]">
          <div className="w-full max-w-md text-center space-y-8 bg-white p-10 rounded-2xl border border-[#EBEBEA] shadow-lg">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <Clock size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{t.waitingOpponent}</h2>
              <p className="text-gray-500 mt-1">{translations[lang].game.shareCode}</p>
            </div>
            <div className="bg-indigo-50/50 p-8 rounded-2xl border-2 border-dashed border-indigo-200">
               <div className="text-[11px] uppercase tracking-[0.2em] text-indigo-400 font-bold mb-2">{translations[lang].game.roomCode}</div>
               <span className="text-4xl font-black tracking-[0.3em] font-mono text-indigo-600">{room.code}</span>
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
        className="flex-1 flex flex-col lg:flex-row overflow-hidden pb-20 md:pb-0"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        {/* Game Area */}
        <div className="flex-1 flex flex-col items-center justify-center bg-[#F7F6F3] p-4 md:p-8 overflow-y-auto">
          <div className="self-start flex items-center justify-between w-full mb-4 md:mb-8">
            <button 
              onClick={() => router.push("/")}
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
          <div className="w-full max-w-[560px] aspect-square bg-white border-[4px] md:border-[12px] border-[#D4C3A3] rounded-[4px] md:rounded-[8px] relative shadow-sm">
            
            {/* Background Grid */}
            <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 z-10">
              {board.map((row, r) => 
                row.map((_, c) => {
                  const isDark = (r + c) % 2 === 1;
                  const isValidHop = validHops.some(h => h.r === r && h.c === c);
                  const isFlash = flashSquare?.r === r && flashSquare?.c === c;
                  const isLastMove = lastMoveSquares && ((lastMoveSquares.from.r === r && lastMoveSquares.from.c === c) || (lastMoveSquares.to.r === r && lastMoveSquares.to.c === c));
                  
                  return (
                    <div 
                      key={`bg-${r}-${c}`}
                      onClick={() => handleCellClick(r, c)}
                      className={`relative flex items-center justify-center cursor-pointer transition-colors duration-150
                        ${isDark ? 'bg-[#8B7355]' : 'bg-[#E3D5C1]'}
                        ${isFlash ? 'bg-red-400' : ''}
                        ${isLastMove ? 'after:absolute after:inset-0 after:bg-indigo-400/30' : ''}
                      `}
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
                        zIndex: isSelected ? 40 : 20
                      }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 300, 
                        damping: 25,
                        opacity: { duration: 0.2 }
                      }}
                    >
                      <div className={`relative w-full h-full rounded-full shadow-lg flex items-center justify-center transition-all duration-300
                        ${piece.player === 'white' ? 'bg-[#F9F9F9]' : 'bg-[#1A1A1A]'}
                        ${isSelected ? 'ring-4 ring-indigo-400 scale-110 shadow-indigo-200' : ''}
                      `}>
                        {/* Piece Design */}
                        <div className={`w-[80%] h-[80%] rounded-full border-2 md:border-4 opacity-20
                          ${piece.player === 'white' ? 'border-black' : 'border-white'}
                        `} />
                        
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
                {mode === 'ai' ? <Bot size={20} className="md:w-6 md:h-6" /> : (opponentProfile?.avatar_url ? <img src={opponentProfile.avatar_url} className="w-full h-full object-cover" /> : <User size={20} className="md:w-6 md:h-6" />)}
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
              {tLanding.history}
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
                {profile?.avatar_url ? <img src={profile.avatar_url} /> : <User size={20} className="md:w-6 md:h-6" />}
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
                const winner = currentPlayer === 'white' ? 'black' : 'white';
                setGameStatus(winner === 'white' ? 'white_won' : 'black_won');
                handleGameOver(winner);
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
                  ${gameStatus === 'white_won' ? 'bg-green-100 text-green-600' : 
                    gameStatus === 'black_won' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}
                `}>
                  {gameStatus === 'white_won' ? <Crown size={32} /> : 
                   gameStatus === 'black_won' ? <Flag size={32} /> : <CheckCircle2 size={32} />}
                </div>
                <h2 className="text-[24px] font-bold mb-2">
                  {gameStatus === 'white_won' ? t.youWon : 
                   gameStatus === 'black_won' ? t.aiWon : t.draw}
                </h2>
                <div className="flex justify-center gap-6 text-[14px] text-gray-500">
                  <div><strong className="text-black">{Math.ceil(moveHistory.length / 2)}</strong> {t.moves}</div>
                  <div><strong className="text-black">{formatTime(5 * 60 - whiteTime)}</strong> {t.time}</div>
                </div>
              </div>

              <div className="p-8 bg-gray-50 text-center relative">
                {user ? (
                  <>
                    <h3 className="text-[16px] font-semibold mb-2 flex items-center justify-center gap-2">
                      <Bot size={18} /> AI Coach
                    </h3>
                    <p className="text-[13px] text-gray-500 mb-4">
                      {gameStatus === 'white_won' ? (lang === 'RU' ? 'Отличная игра! Вы точно следовали стратегии.' : 'Great game! You followed the strategy perfectly.') : (lang === 'RU' ? 'В следующий раз попробуйте контролировать центр доски.' : 'Next time, try to control the center of the board.')}
                    </p>
                    
                    {(window as any).lastReward > 0 && (
                      <div className="mb-6 p-3 bg-amber-50 border border-amber-100 rounded-lg text-amber-700 font-bold text-[14px] flex items-center justify-center gap-2 animate-bounce">
                        <Coins size={16} color="#d4a017" /> +{(window as any).lastReward} {translations[lang].topbar.coins}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <h3 className="text-[16px] font-semibold mb-2">{t.unlockAnalysis}</h3>
                    <p className="text-[13px] text-gray-500 mb-6">{t.analysisSub}</p>

                    <div className="relative h-[100px] mb-6 rounded-[8px] overflow-hidden border border-[#EBEBEA] bg-white">
                      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHRleHQgeD0iMCIgeT0iMTUiIGZpbGw9IiNlN2U3ZTciIGZvbnQtZmFtaWx5PSJtb25vc3BhY2UiIGZvbnQtc2l6ZT0iMTIiPjEyLiA8L3RleHQ+PC9zdmc+')] opacity-50"></div>
                      <div className="absolute inset-0 backdrop-blur-[4px] bg-white/60 flex items-center justify-center">
                        <Lock className="text-gray-400" size={24} />
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-3">
                  {!user && (
                    <button 
                      onClick={() => {
                        openAuthModal();
                      }}
                      className="w-full bg-black text-white py-3 rounded-[8px] text-[14px] font-semibold hover:bg-gray-800 transition-colors"
                    >
                      {t.registerAnalysis}
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      setBoard(createInitialBoard());
                      setCurrentPlayer('white');
                      setGameStatus('playing');
                      setMoveHistory([]);
                      setWhiteTime(5 * 60);
                      setBlackTime(5 * 60);
                      (window as any).lastReward = 0;
                    }}
                    className="w-full bg-white text-black border border-[#EBEBEA] py-3 rounded-[8px] text-[14px] font-semibold hover:bg-gray-50 transition-colors"
                  >
                    {t.playAgain}
                  </button>
                </div>
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
    <Suspense fallback={<div>Loading...</div>}>
      <GameContent />
    </Suspense>
  );
}
