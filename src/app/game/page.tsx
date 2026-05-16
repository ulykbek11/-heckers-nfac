"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { TopBar } from "@/components/TopBar";
import { useAppStore } from "@/store/useAppStore";
import { translations } from "@/lib/i18n";
import { createInitialBoard, getValidMoves, applyMove, getBestMove, Board, Move, Player, Piece } from "@/lib/checkers";
import { Clock, History as HistoryIcon, Flag, Crown, CheckCircle2, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function GameContent() {
  const router = useRouter();
  const { lang, openAuthModal } = useAppStore();
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

  const searchParams = useSearchParams();
  const difficulty = searchParams.get('difficulty') || "Легко";
  const aiDepth = difficulty === "Сложно" ? 6 : difficulty === "Средне" ? 4 : 2;

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

  const checkGameEnd = useCallback((currentBoard: Board, nextPlayer: Player) => {
    const nextMoves = getValidMoves(currentBoard, nextPlayer);
    if (nextMoves.length === 0) {
      setGameStatus(nextPlayer === 'white' ? 'black_won' : 'white_won');
    }
  }, []);

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
    if (currentPlayer === 'black' && gameStatus === 'playing') {
      setAiThinking(true);
      const timeout = setTimeout(() => {
        const bestMove = getBestMove(board, 'black', aiDepth);
        if (bestMove) {
          animateAiMove(bestMove);
        } else {
          setGameStatus('white_won');
        }
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [currentPlayer, board, gameStatus, aiDepth]);

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
    if (gameStatus !== 'playing' || currentPlayer !== 'white') return;
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
             setCurrentPlayer('black');
             checkGameEnd(newBoard, 'black');
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

    if (board[r][c]?.player === 'white') {
      const allMoves = getValidMoves(board, 'white');
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
              setCurrentPlayer('black');
              checkGameEnd(newBoard, 'black');
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

  return (
    <>
      <TopBar titleKey="gameVsAi" />
      <motion.main 
        className="flex-1 flex overflow-hidden"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <div className="flex-1 flex flex-col items-center justify-center bg-[#F7F6F3] p-8">
          <button 
            onClick={() => router.push("/")}
            className="self-start mb-8 px-4 py-2 bg-white border border-[#EBEBEA] rounded-[8px] text-[13px] font-semibold hover:bg-gray-50 transition-colors"
          >
            {t.back}
          </button>
          
          <div className="w-[560px] h-[560px] bg-white border-[12px] border-[#D4C3A3] rounded-[8px] relative shadow-sm">
            
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
                          <div className="absolute w-6 h-6 rounded-full border-4 border-green-500 animate-ping opacity-75 z-10" />
                        ) : (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.15 }}
                            className="absolute w-4 h-4 rounded-full bg-[#6366F1]/60 z-10" 
                          />
                        )
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Pieces */}
            <div className="absolute inset-0 z-20 pointer-events-none">
              {visualBoard.flatMap((row, r) => 
                row.map((piece, c) => {
                  if (!piece) return null;
                  const isCaptured = capturedIds.includes(piece.id);
                  const isSelected = (selectedCell?.r === r && selectedCell?.c === c) || (chainState && chainState.currentSquare.r === r && chainState.currentSquare.c === c);
                  
                  return (
                    <motion.div 
                      key={piece.id}
                      layoutId={piece.id}
                      initial={false}
                      animate={{ 
                        top: `${r * 12.5}%`, 
                        left: `${c * 12.5}%`,
                        scale: isCaptured ? 0 : 1,
                        opacity: isCaptured ? 0 : 1
                      }}
                      transition={{ 
                        type: "tween", 
                        ease: [0.25, 0.46, 0.45, 0.94], 
                        duration: isCaptured ? 0.18 : 0.22 
                      }}
                      className="absolute w-[12.5%] h-[12.5%] flex items-center justify-center"
                    >
                      <div className={`w-[85%] h-[85%] rounded-full shadow-md flex items-center justify-center transition-transform
                        ${piece.player === 'white' ? 'bg-[#FDFBF7] border-2 border-[#D4C3A3]' : 'bg-[#2A2A2A] border-2 border-[#1A1A1A]'}
                        ${isSelected ? 'ring-4 ring-[#6366F1] scale-110' : ''}
                      `}>
                        {piece.type === 'king' && (
                           <motion.div
                             initial={{ scale: 1 }}
                             animate={{ scale: [1, 1.15, 1] }}
                             transition={{ duration: 0.8 }}
                           >
                             <Crown size={24} className={piece.player === 'white' ? 'text-[#D4C3A3]' : 'text-[#666]'} />
                           </motion.div>
                        )}
                        {piece.type === 'man' && (
                          <div className={`w-[60%] h-[60%] rounded-full border border-black/10 
                            ${piece.player === 'white' ? 'bg-white/50' : 'bg-white/10'}`} 
                          />
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="w-[320px] bg-white border-l border-[#EBEBEA] flex flex-col h-full">
          <div className="p-6 border-b border-[#EBEBEA] bg-gray-50 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white">
                🤖
              </div>
              <div>
                <div className="font-semibold">{t.black}</div>
                <div className="text-[12px] text-gray-500">{difficulty === "Сложно" ? tLanding.hardAi : difficulty === "Средне" ? tLanding.mediumAi : tLanding.easyAi}</div>
              </div>
            </div>
            <div className={`flex items-center gap-1.5 font-mono text-[20px] font-semibold ${currentPlayer === 'black' ? 'text-black' : 'text-gray-400'}`}>
              <Clock size={16} /> {formatTime(blackTime)}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 flex flex-col">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-gray-400 uppercase tracking-wider mb-4">
              <HistoryIcon size={16} />
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
              {Array.from({ length: Math.ceil(moveHistory.length / 2) }).map((_, i) => (
                <div key={i} className="flex text-[14px]">
                  <div className="w-8 text-gray-400 font-mono">{i + 1}.</div>
                  <div className="flex-1 font-mono">{moveHistory[i * 2]}</div>
                  <div className="flex-1 font-mono text-gray-500">{moveHistory[i * 2 + 1] || ''}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 border-t border-[#EBEBEA] flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white border border-[#EBEBEA] rounded-full flex items-center justify-center text-gray-600">
                👤
              </div>
              <div>
                <div className="font-semibold">{t.white}</div>
                <div className="text-[12px] text-[#6366F1] font-semibold">{t.yourTurn}</div>
              </div>
            </div>
            <div className={`flex items-center gap-1.5 font-mono text-[20px] font-semibold ${currentPlayer === 'white' ? 'text-black' : 'text-gray-400'}`}>
              <Clock size={16} /> {formatTime(whiteTime)}
            </div>
          </div>

          <div className="p-6 pt-0">
            <button 
              onClick={() => setGameStatus('black_won')}
              disabled={gameStatus !== 'playing'}
              className="w-full py-3 rounded-[8px] border border-[#EBEBEA] text-[14px] font-semibold hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Flag size={16} />
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
                <h3 className="text-[16px] font-semibold mb-2">{t.unlockAnalysis}</h3>
                <p className="text-[13px] text-gray-500 mb-6">{t.analysisSub}</p>

                <div className="relative h-[100px] mb-6 rounded-[8px] overflow-hidden border border-[#EBEBEA] bg-white">
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHRleHQgeD0iMCIgeT0iMTUiIGZpbGw9IiNlN2U3ZTciIGZvbnQtZmFtaWx5PSJtb25vc3BhY2UiIGZvbnQtc2l6ZT0iMTIiPjEyLiA8L3RleHQ+PC9zdmc+')] opacity-50"></div>
                  <div className="absolute inset-0 backdrop-blur-[4px] bg-white/60 flex items-center justify-center">
                    <Lock className="text-gray-400" size={24} />
                  </div>
                </div>

                <div className="space-y-3">
                  <button 
                    onClick={() => {
                      openAuthModal();
                    }}
                    className="w-full bg-black text-white py-3 rounded-[8px] text-[14px] font-semibold hover:bg-gray-800 transition-colors"
                  >
                    {t.registerAnalysis}
                  </button>
                  <button 
                    onClick={() => {
                      setBoard(createInitialBoard());
                      setCurrentPlayer('white');
                      setGameStatus('playing');
                      setMoveHistory([]);
                      setWhiteTime(5 * 60);
                      setBlackTime(5 * 60);
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
