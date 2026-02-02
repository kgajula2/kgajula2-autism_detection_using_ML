import { create } from 'zustand';

// --- Adaptive Screening Configuration ---
export const SCREENING_CONFIG = {
    MANDATORY_GAMES: ['free-toy-tap', 'attention-call'],
    MIN_TOTAL_GAMES: 3,
    ALL_GAMES: [
        'free-toy-tap',
        'attention-call',
        'color-focus',
        'routine-sequencer',
        'emotion-mirror',
        'object-id',
        'shape-switch'
    ],
};

export const useGameStore = create((set, get) => ({
    gameState: 'IDLE',  // IDLE, ACTIVE, PAUSED, COMPLETE
    score: 0,
    round: 1,

    // --- Adaptive Screening State ---
    sessionPlayedGames: [], // Game IDs completed in this session

    setGameState: (state) => set({ gameState: state }),
    setScore: (score) => set({ score }),
    incrementScore: (amount) => set((state) => ({ score: Math.max(0, state.score + amount) })),
    nextRound: () => set((state) => ({ round: state.round + 1 })),
    resetGame: () => set({ gameState: 'IDLE', score: 0, round: 1 }),

    // --- Adaptive Screening Actions ---
    markGamePlayed: (gameId) => set((state) => {
        if (state.sessionPlayedGames.includes(gameId)) {
            return state; // Already played, no change
        }
        return { sessionPlayedGames: [...state.sessionPlayedGames, gameId] };
    }),

    resetScreeningSession: () => set({ sessionPlayedGames: [] }),

    // --- Validation Helpers ---
    getScreeningStatus: () => {
        const { sessionPlayedGames } = get();
        const { MANDATORY_GAMES, MIN_TOTAL_GAMES } = SCREENING_CONFIG;

        const mandatoryPlayed = MANDATORY_GAMES.filter(g => sessionPlayedGames.includes(g));
        const choicePlayed = sessionPlayedGames.filter(g => !MANDATORY_GAMES.includes(g));

        const hasBothMandatory = mandatoryPlayed.length === MANDATORY_GAMES.length;
        const hasChoice = choicePlayed.length >= 1;
        const totalPlayed = sessionPlayedGames.length;
        const isValid = hasBothMandatory && hasChoice && totalPlayed >= MIN_TOTAL_GAMES;

        return {
            mandatoryPlayed,
            choicePlayed,
            hasBothMandatory,
            hasChoice,
            totalPlayed,
            isValid,
            missingMandatory: MANDATORY_GAMES.filter(g => !sessionPlayedGames.includes(g)),
            remainingForMin: Math.max(0, MIN_TOTAL_GAMES - totalPlayed),
        };
    },
}));
