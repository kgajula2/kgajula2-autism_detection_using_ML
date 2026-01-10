import { create } from 'zustand';

export const useGameStore = create((set) => ({
    gameState: 'IDLE', // IDLE, PLAYING, COMPLETED, PAUSED
    score: 0,
    round: 1,

    setGameState: (state) => set({ gameState: state }),
    setScore: (score) => set({ score }),
    incrementScore: (amount) => set((state) => ({ score: Math.max(0, state.score + amount) })),
    nextRound: () => set((state) => ({ round: state.round + 1 })),
    resetGame: () => set({ gameState: 'IDLE', score: 0, round: 1 }),
}));
