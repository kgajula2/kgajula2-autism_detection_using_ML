import { describe, it, expect, vi } from 'vitest';
import { aggregateGameResults } from '../services/ml';

describe('ML Service', () => {

    describe('aggregateGameResults Function', () => {

        it('returns default features when no game data provided', () => {
            const result = aggregateGameResults({});
            expect(result.features).toBeDefined();
            expect(result.insights).toEqual([]);
        });

        it('detects attention issues from Color Focus game', () => {
            const gameData = {
                'color-focus': { score: 30, errors: 8 }
            };
            const result = aggregateGameResults(gameData);

             
            expect(result.features.A1).toBe(1);
             
            expect(result.features.A7).toBe(1);
            expect(result.insights.length).toBeGreaterThan(0);
        });

        it('detects good impulse control in Color Focus', () => {
            const gameData = {
                'color-focus': { score: 90, errors: 2 }
            };
            const result = aggregateGameResults(gameData);

            expect(result.features.A1).toBe(0);
            expect(result.features.A7).toBe(0);
            expect(result.insights).toContainEqual(expect.stringContaining('impulse control'));
        });

        it('detects routine sequencing issues', () => {
            const gameData = {
                'routine-sequencer': { mistakes: 5, completed: true }
            };
            const result = aggregateGameResults(gameData);

            expect(result.features.A2).toBe(1);
            expect(result.insights).toContainEqual(expect.stringContaining('A2'));
        });

        it('detects emotion recognition issues', () => {
            const gameData = {
                'emotion-mirror': { score: 20, attempts: 5 }
            };
            const result = aggregateGameResults(gameData);

            expect(result.features.A5).toBe(1);
            expect(result.features.A6).toBe(1);
        });

        it('detects object identification issues', () => {
            const gameData = {
                'object-id': { correct: 3, wrong: 7 }
            };
            const result = aggregateGameResults(gameData);

            expect(result.features.A9).toBe(1);
            expect(result.features.A10).toBe(1);
        });

        it('handles combined game data correctly', () => {
            const gameData = {
                'color-focus': { score: 80, errors: 3 },
                'routine-sequencer': { mistakes: 1, completed: true },
                'emotion-mirror': { score: 75, attempts: 5 },
                'object-id': { correct: 9, wrong: 1 }
            };
            const result = aggregateGameResults(gameData);

             
            expect(result.features.A1).toBe(0);
            expect(result.features.A2).toBe(0);
            expect(result.features.A5).toBe(0);
            expect(result.features.A9).toBe(0);
            expect(result.insights.length).toBeGreaterThan(0);
        });
    });
});
