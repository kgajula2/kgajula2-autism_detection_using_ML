import { useState, useRef, useCallback } from 'react';
import { createGameSession, endGameSession, logRoundMetrics } from '../services/db';
import { analyzeUserPerformance } from '../services/ml';
import useAuth from './useAuth';
import { useGameStore } from '../store/gameStore';



export function useGameSession(gameType) {
    const { userId, withAuth } = useAuth();
    const markGamePlayed = useGameStore(state => state.markGamePlayed);
    const [sessionId, setSessionId] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const startTimeRef = useRef(0);



    const startSession = useCallback(async (initialData = {}) => {
        startTimeRef.current = Date.now();

        const sid = await withAuth(async (uid) => {
            try {
                const id = await createGameSession(uid, gameType, initialData);
                setSessionId(id);
                return id;
            } catch (err) {
                console.error(`Failed to create ${gameType} session:`, err);
                return null;
            }
        });

        return sid;
    }, [gameType, withAuth]);


    const logMetrics = useCallback(async (metrics) => {
        if (!sessionId) {
            console.warn('logMetrics: No active session');
            return;
        }

        try {
            await logRoundMetrics(sessionId, {
                game: gameType,
                timestamp: Date.now(),
                ...metrics,
            });
        } catch (err) {
            console.error('Failed to log metrics:', err);
        }
    }, [sessionId, gameType]);


    const endSession = useCallback(async (finalScore, finalStats = {}, runAnalysis = true) => {
        const duration = (Date.now() - startTimeRef.current) / 1000;

        if (sessionId) {
            try {
                await endGameSession(sessionId, finalScore, {
                    ...finalStats,
                    duration,
                });
                // Mark this game as played for screening progress
                markGamePlayed(gameType);
            } catch (err) {
                console.error('Failed to end session:', err);
            }
        }

        if (runAnalysis) {
            setIsAnalyzing(true);
            try {
                const gameData = {
                    [gameType]: {
                        score: finalScore,
                        duration,
                        ...finalStats,
                    },
                };
                const result = await analyzeUserPerformance(gameData);
                setAnalysisResult(result);
                return result;
            } catch (err) {
                console.error('Analysis failed:', err);
                return null;
            } finally {
                setIsAnalyzing(false);
            }
        }

        return null;
    }, [sessionId, gameType]);


    const resetSession = useCallback(() => {
        setSessionId(null);
        setAnalysisResult(null);
        setIsAnalyzing(false);
        startTimeRef.current = 0;
    }, []);


    const getElapsedTime = useCallback(() => {
        if (!startTimeRef.current) return 0;
        return (Date.now() - startTimeRef.current) / 1000;
    }, []);

    return {
        sessionId,
        isAnalyzing,
        analysisResult,
        startSession,
        logMetrics,
        endSession,
        resetSession,
        getElapsedTime,
    };
}

export default useGameSession;
