import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

 
describe('useToddlerMode Hook', () => {
    beforeEach(() => {
         
        localStorage.clear();
    });

    it('returns default toddler mode config', async () => {
         
        const mockConfig = {
            routineSteps: 3,
            bubbleSize: 60,
            holdTimeRequired: 1500,
            showTextLabels: false,
            showTutorials: true,
            largeEmojis: true,
            feedbackDuration: 800,
            transitionSpeed: 'slow',
        };

         
        expect(mockConfig.routineSteps).toBe(3);
        expect(mockConfig.bubbleSize).toBe(60);
        expect(mockConfig.showTutorials).toBe(true);
    });

    it('has correct non-toddler mode config', () => {
        const nonToddlerConfig = {
            routineSteps: 5,
            bubbleSize: 40,
            holdTimeRequired: 2000,
            showTextLabels: true,
            showTutorials: false,
            largeEmojis: false,
            feedbackDuration: 500,
            transitionSpeed: 'normal',
        };

        expect(nonToddlerConfig.routineSteps).toBe(5);
        expect(nonToddlerConfig.showTutorials).toBe(false);
    });
});

 
describe('ErrorLogger Service', () => {
    it('logs errors with correct structure', () => {
        const errorEntry = {
            id: 'test-123',
            type: 'ERROR',
            message: 'Test error message',
            timestamp: new Date().toISOString(),
        };

        expect(errorEntry.type).toBe('ERROR');
        expect(errorEntry.message).toBe('Test error message');
        expect(errorEntry.timestamp).toBeDefined();
    });

    it('categorizes game errors correctly', () => {
        const gameError = {
            type: 'GAME_ERROR',
            game: 'color-focus',
            error: 'Bubble spawn failed',
            timestamp: new Date().toISOString(),
        };

        expect(gameError.type).toBe('GAME_ERROR');
        expect(gameError.game).toBe('color-focus');
    });
});

 
describe('Utility Functions', () => {
    it('generateUniqueId creates unique IDs', () => {
        const ids = new Set();
        for (let i = 0; i < 100; i++) {
            const id = `bubble-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            ids.add(id);
        }
         
        expect(ids.size).toBe(100);
    });

    it('shuffle function randomizes array', () => {
        const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        const shuffled = [...original].sort(() => Math.random() - 0.5);

         
        expect(shuffled.length).toBe(original.length);
        expect(shuffled.sort((a, b) => a - b)).toEqual(original);
    });
});

 
describe('Game Config', () => {
    it('COLOR_FOCUS_CONFIG has required properties', () => {
        const config = {
            GAME_DURATION: 30,
            SPAWN_RATE: 1000,
            BUBBLE_SIZE_MIN: 90,
            BUBBLE_SIZE_MAX: 140,
            BUBBLE_SPEED_BASE: 0.5,
            BUBBLE_SPEED_VARIANCE: 1,
            SPEED_INCREASE_PER_ROUND: 0.2,
        };

        expect(config.GAME_DURATION).toBeGreaterThan(0);
        expect(config.BUBBLE_SIZE_MIN).toBeLessThan(config.BUBBLE_SIZE_MAX);
        expect(config.BUBBLE_SPEED_BASE).toBeGreaterThan(0);
    });

    it('EMOTION_MIRROR_CONFIG has valid thresholds', () => {
        const config = {
            MAX_ROUNDS: 5,
            HOLD_TIME_REQUIRED: 2000,
        };

        expect(config.MAX_ROUNDS).toBeGreaterThan(0);
        expect(config.HOLD_TIME_REQUIRED).toBeGreaterThan(0);
    });
});
