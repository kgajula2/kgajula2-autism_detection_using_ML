import { create } from 'zustand';

export const useSettingsStore = create((set) => ({
    soundEnabled: true,
    toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
    difficulty: 'normal', // easy, normal, hard
    setDifficulty: (difficulty) => set({ difficulty }),
}));
