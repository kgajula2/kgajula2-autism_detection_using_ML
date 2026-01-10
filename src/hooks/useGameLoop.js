import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';

export const useGameLoop = (gameLogicCallback, dependencies = []) => {
    const { gameState, setGameState } = useGameStore();
    const frameRef = useRef();
    const lastTimeRef = useRef(0);

    const savedCallback = useRef(gameLogicCallback);

    // Update ref when callback changes
    useEffect(() => {
        savedCallback.current = gameLogicCallback;
    }, [gameLogicCallback]);

    useEffect(() => {
        if (gameState !== 'ACTIVE') {
            cancelAnimationFrame(frameRef.current);
            return;
        }

        const loop = (time) => {
            if (lastTimeRef.current === 0) {
                lastTimeRef.current = time;
            }

            const deltaTime = (time - lastTimeRef.current) / 1000;
            lastTimeRef.current = time;

            if (savedCallback.current) {
                savedCallback.current(deltaTime);
            }

            frameRef.current = requestAnimationFrame(loop);
        };

        frameRef.current = requestAnimationFrame(loop);

        return () => {
            cancelAnimationFrame(frameRef.current);
            lastTimeRef.current = 0;
        };
    }, [gameState]);

    return {
        gameState,
        startGame: () => setGameState('ACTIVE'),
        pauseGame: () => setGameState('PAUSED'),
        stopGame: () => setGameState('COMPLETE')
    };
};
