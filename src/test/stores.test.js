import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useGameStore } from '../store/gameStore';
import { useUserStore } from '../store/userStore';
import { useSettingsStore } from '../store/settingsStore';

describe('Zustand Stores', () => {

    describe('Game Store', () => {
        beforeEach(() => {
            useGameStore.getState().resetGame();
        });

        it('starts with IDLE state', () => {
            const state = useGameStore.getState();
            expect(state.gameState).toBe('IDLE');
            expect(state.score).toBe(0);
            expect(state.round).toBe(1);
        });

        it('sets game state correctly', () => {
            useGameStore.getState().setGameState('ACTIVE');
            expect(useGameStore.getState().gameState).toBe('ACTIVE');
        });

        it('increments score correctly', () => {
            useGameStore.getState().incrementScore(10);
            expect(useGameStore.getState().score).toBe(10);

            useGameStore.getState().incrementScore(5);
            expect(useGameStore.getState().score).toBe(15);
        });

        it('does not allow negative scores', () => {
            useGameStore.getState().incrementScore(-100);
            expect(useGameStore.getState().score).toBe(0);
        });

        it('advances rounds correctly', () => {
            useGameStore.getState().nextRound();
            expect(useGameStore.getState().round).toBe(2);

            useGameStore.getState().nextRound();
            expect(useGameStore.getState().round).toBe(3);
        });

        it('resets game correctly', () => {
            useGameStore.getState().setGameState('ACTIVE');
            useGameStore.getState().incrementScore(100);
            useGameStore.getState().nextRound();

            useGameStore.getState().resetGame();

            const state = useGameStore.getState();
            expect(state.gameState).toBe('IDLE');
            expect(state.score).toBe(0);
            expect(state.round).toBe(1);
        });
    });

    describe('User Store', () => {
        beforeEach(() => {
            useUserStore.getState().setUser(null);
        });

        it('starts with null user', () => {
            const state = useUserStore.getState();
            expect(state.user).toBeNull();
        });

        it('sets user correctly', () => {
            const mockUser = { uid: '123', displayName: 'Test User' };
            useUserStore.getState().setUser(mockUser);
            expect(useUserStore.getState().user).toEqual(mockUser);
            expect(useUserStore.getState().loading).toBe(false);
        });
    });

    describe('Settings Store', () => {
        it('has sound enabled by default', () => {
            const state = useSettingsStore.getState();
            expect(state.soundEnabled).toBe(true);
        });

        it('toggles sound correctly', () => {
            useSettingsStore.getState().toggleSound();
            expect(useSettingsStore.getState().soundEnabled).toBe(false);

            useSettingsStore.getState().toggleSound();
            expect(useSettingsStore.getState().soundEnabled).toBe(true);
        });

        it('sets difficulty correctly', () => {
            useSettingsStore.getState().setDifficulty('hard');
            expect(useSettingsStore.getState().difficulty).toBe('hard');
        });
    });
});
