import { describe, it, expect, vi } from 'vitest';
import { calculateGameRisks } from '../services/ml';

describe('ML Service', () => {

    describe('calculateGameRisks Function', () => {

        it('returns default risks when no game data provided', () => {
            const result = calculateGameRisks({});
            expect(result.gameRisks).toBeDefined();
            expect(result.insights).toEqual([]);
            // All risks should be default 0.3
            expect(result.gameRisks.color_focus).toBe(0.3);
            expect(result.gameRisks.routine_sequencer).toBe(0.3);
        });

        it('detects attention issues from Color Focus game (low score, high errors)', () => {
            const gameData = {
                'color-focus': { score: 30, errors: 8 }
            };
            const result = calculateGameRisks(gameData);

            // High risk due to low score and high errors
            expect(result.gameRisks.color_focus).toBeGreaterThan(0.5);
            expect(result.insights.length).toBeGreaterThan(0);
        });

        it('detects good impulse control in Color Focus (high score, low errors)', () => {
            const gameData = {
                'color-focus': { score: 90, errors: 1 }
            };
            const result = calculateGameRisks(gameData);

            // Low risk due to high score and low errors
            expect(result.gameRisks.color_focus).toBeLessThan(0.3);
            expect(result.insights.some(i => i.includes('Excellent') || i.includes('impulse control'))).toBe(true);
        });

        it('detects routine sequencing issues (many mistakes)', () => {
            const gameData = {
                'routine-sequencer': { mistakes: 5, completed: true }
            };
            const result = calculateGameRisks(gameData);

            // Higher risk due to mistakes
            expect(result.gameRisks.routine_sequencer).toBeGreaterThan(0.5);
            expect(result.insights.length).toBeGreaterThan(0);
        });

        it('detects emotion recognition issues (low accuracy)', () => {
            const gameData = {
                'emotion-mirror': { score: 20, attempts: 5 }
            };
            const result = calculateGameRisks(gameData);

            // Higher risk due to low emotion recognition
            expect(result.gameRisks.emotion_mirror).toBeGreaterThan(0.5);
        });

        it('detects object identification issues (low accuracy)', () => {
            const gameData = {
                'object-id': { correct: 3, wrong: 7 }
            };
            const result = calculateGameRisks(gameData);

            // Higher risk due to low identification accuracy
            expect(result.gameRisks.object_hunt).toBeGreaterThan(0.3);
        });

        it('detects attention call issues (low response rate)', () => {
            const gameData = {
                'attention-call': { responseRate: 0.2, avgResponseTime: 3500, totalResponses: 1, totalCalls: 5 }
            };
            const result = calculateGameRisks(gameData);

            // Higher risk due to low response rate and slow response
            expect(result.gameRisks.attention_call).toBeGreaterThan(0.5);
        });

        it('detects free toy tap repetitive behavior', () => {
            const gameData = {
                'free-toy-tap': { objectFixationEntropy: 0.5, repetitionRate: 0.7, switchFrequency: 0.1, totalTaps: 20 }
            };
            const result = calculateGameRisks(gameData);

            // Higher risk due to low entropy, high repetition, low switching
            expect(result.gameRisks.free_toy_tap).toBeGreaterThan(0.5);
        });

        it('handles combined game data correctly (good performance)', () => {
            const gameData = {
                'color-focus': { score: 85, errors: 1 },
                'routine-sequencer': { mistakes: 0, completed: true },
                'emotion-mirror': { score: 75, attempts: 5 },
                'object-id': { correct: 9, wrong: 1 }
            };
            const result = calculateGameRisks(gameData);

            // All risks should be low for good performance
            expect(result.gameRisks.color_focus).toBeLessThan(0.3);
            expect(result.gameRisks.routine_sequencer).toBeLessThan(0.3);
            expect(result.gameRisks.emotion_mirror).toBeLessThan(0.5);
            expect(result.gameRisks.object_hunt).toBeLessThan(0.3);
            expect(result.insights.length).toBeGreaterThan(0);
        });
    });
});
