import { db } from "./firebase";
import {
    query,
    where,
    getDocs,
    limit,
    collection,
    addDoc,
    updateDoc,
    doc,
    serverTimestamp,
    getDoc,
    setDoc,
    deleteDoc
} from "firebase/firestore";



const USERS_COLLECTION = "users";
const SESSIONS_COLLECTION = "game_sessions";
const METRICS_COLLECTION = "round_metrics";


const OFFLINE_QUEUE_KEY = 'neurostep_offline_queue';


const getOfflineQueue = () => {
    try {
        const data = localStorage.getItem(OFFLINE_QUEUE_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
};


const addToOfflineQueue = (type, data) => {
    try {
        const queue = getOfflineQueue();
        queue.push({ type, data, timestamp: Date.now() });
        localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    } catch (e) {
        console.error("Failed to save to offline queue", e);
    }
};


const clearOfflineQueue = () => {
    try {
        localStorage.removeItem(OFFLINE_QUEUE_KEY);
    } catch (e) {
        console.error("Failed to clear offline queue", e);
    }
};


export const syncOfflineQueue = async () => {
    const queue = getOfflineQueue();
    if (queue.length === 0) return;

    const errors = [];

    for (const item of queue) {
        try {
            if (item.type === 'session_start') {
                await addDoc(collection(db, SESSIONS_COLLECTION), item.data);
            } else if (item.type === 'session_end') {
                const sessionRef = doc(db, SESSIONS_COLLECTION, item.data.sessionId);
                await updateDoc(sessionRef, item.data.updates);
            } else if (item.type === 'metrics') {
                await addDoc(collection(db, METRICS_COLLECTION), item.data);
            }
        } catch (e) {
            errors.push({ item, error: e.message });
        }
    }

    if (errors.length === 0) {
        clearOfflineQueue();
    } else {
        console.error("⚠️ Some items failed to sync", errors);
    }
};


export const createUserProfile = async (uid, data) => {
    try {
        await setDoc(doc(db, USERS_COLLECTION, uid), {
            ...data,
            updatedAt: serverTimestamp(),
            createdAt: serverTimestamp(),
        }, { merge: true });
    } catch (e) {
        console.error("Failed to create user profile:", e);
        throw new Error("Could not save profile. Please check your connection.");
    }
};

export const getUserProfile = async (uid) => {
    try {
        const docRef = doc(db, USERS_COLLECTION, uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data();
        } else {
            return null;
        }
    } catch (e) {
        console.error("Failed to get user profile:", e);
        return null;
    }
};

export const createGameSession = async (userId, gameId, gameConfig) => {
    const sessionData = {
        userId,
        gameId,
        startTime: serverTimestamp(),
        config: gameConfig,
        status: 'ACTIVE',
        score: 0,
    };

    try {
        const sessionRef = await addDoc(collection(db, SESSIONS_COLLECTION), sessionData);
        return sessionRef.id;
    } catch (e) {
        console.error("Failed to create game session:", e);


        const localId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        addToOfflineQueue('session_start', {
            ...sessionData,
            startTime: new Date().toISOString(),
            localId
        });

        return localId;
    }
};

export const logRoundMetrics = async (sessionId, roundData) => {
    const metricsData = {
        sessionId,
        timestamp: serverTimestamp(),
        ...roundData
    };

    try {
        await addDoc(collection(db, METRICS_COLLECTION), metricsData);
    } catch (e) {
        console.error("Failed to log round metrics:", e);


        addToOfflineQueue('metrics', {
            ...metricsData,
            timestamp: new Date().toISOString()
        });
    }
};

export const endGameSession = async (sessionId, finalScore, stats) => {

    if (sessionId.startsWith('local_')) {
        addToOfflineQueue('session_end', {
            sessionId,
            updates: {
                endTime: new Date().toISOString(),
                status: 'COMPLETE',
                score: finalScore,
                stats
            }
        });
        return;
    }

    try {
        const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId);
        await updateDoc(sessionRef, {
            endTime: serverTimestamp(),
            status: 'COMPLETE',
            score: finalScore,
            stats
        });
    } catch (e) {
        console.error("Failed to end game session:", e);


        addToOfflineQueue('session_end', {
            sessionId,
            updates: {
                endTime: new Date().toISOString(),
                status: 'COMPLETE',
                score: finalScore,
                stats
            }
        });
    }
};

export const fetchUserGameStats = async (userId) => {
    try {

        const q = query(
            collection(db, SESSIONS_COLLECTION),
            where("userId", "==", userId),
            where("status", "==", "COMPLETE"),
            limit(50)
        );

        const querySnapshot = await getDocs(q);
        const sessions = [];
        querySnapshot.forEach((doc) => {
            sessions.push({ id: doc.id, ...doc.data() });
        });


        sessions.sort((a, b) => {
            const timeA = a.endTime?.seconds || 0;
            const timeB = b.endTime?.seconds || 0;
            return timeB - timeA;
        });


        const aggregated = {};
        sessions.forEach(session => {
            const gameId = session.gameId;
            if (!aggregated[gameId]) {

                aggregated[gameId] = {
                    score: session.score || 0,
                    count: 1,
                    mistakes: session.stats?.mistakes || 0,
                    errors: session.stats?.errors || 0,
                    duration: session.stats?.duration || 0,
                    correct: session.stats?.correct || 0,
                    wrong: session.stats?.wrong || 0,
                    attempts: session.stats?.attempts || 0,
                    completed: session.stats?.completed || false,
                    avgLatency: session.stats?.avgLatency || 0,

                    // Free Toy Tap specific metrics
                    objectFixationEntropy: session.stats?.objectFixationEntropy || 0,
                    repetitionRate: session.stats?.repetitionRate || 0,
                    switchFrequency: session.stats?.switchFrequency || 0,
                    engagementTime: session.stats?.engagementTime || 0,
                    totalTaps: session.stats?.totalTaps || 0,
                    pauseCount: session.stats?.pauseCount || 0,

                    // Attention Call specific metrics
                    responseRate: session.stats?.responseRate || 0,
                    avgResponseTime: session.stats?.avgResponseTime || 0,
                    totalResponses: session.stats?.totalResponses || 0,
                    totalCalls: session.stats?.totalCalls || 0,
                    firstResponseCall: session.stats?.firstResponseCall || null,
                    responseType: session.stats?.responseType || null,
                };
            } else {
                // Increment play count
                aggregated[gameId].count += 1;
                const count = aggregated[gameId].count;

                // Update best score
                if (session.score > aggregated[gameId].score) {
                    aggregated[gameId].score = session.score;
                }

                // Update total mistakes/errors (cumulative)
                aggregated[gameId].mistakes += session.stats?.mistakes || 0;
                aggregated[gameId].errors += session.stats?.errors || 0;
                aggregated[gameId].wrong += session.stats?.wrong || 0;
                aggregated[gameId].correct += session.stats?.correct || 0;
                aggregated[gameId].attempts += session.stats?.attempts || 0;

                // Update duration (average)
                if (session.stats?.duration) {
                    aggregated[gameId].duration =
                        ((aggregated[gameId].duration * (count - 1)) + session.stats.duration) / count;
                }

                // Free Toy Tap - running averages for behavioral metrics
                if (session.stats?.objectFixationEntropy !== undefined) {
                    aggregated[gameId].objectFixationEntropy =
                        ((aggregated[gameId].objectFixationEntropy * (count - 1)) + session.stats.objectFixationEntropy) / count;
                }
                if (session.stats?.repetitionRate !== undefined) {
                    aggregated[gameId].repetitionRate =
                        ((aggregated[gameId].repetitionRate * (count - 1)) + session.stats.repetitionRate) / count;
                }
                if (session.stats?.switchFrequency !== undefined) {
                    aggregated[gameId].switchFrequency =
                        ((aggregated[gameId].switchFrequency * (count - 1)) + session.stats.switchFrequency) / count;
                }
                if (session.stats?.engagementTime !== undefined) {
                    aggregated[gameId].engagementTime += session.stats.engagementTime;
                }
                if (session.stats?.totalTaps !== undefined) {
                    aggregated[gameId].totalTaps += session.stats.totalTaps;
                }
                if (session.stats?.pauseCount !== undefined) {
                    aggregated[gameId].pauseCount += session.stats.pauseCount;
                }

                // Attention Call - use best response rate, average response time
                if (session.stats?.responseRate !== undefined) {
                    aggregated[gameId].responseRate = Math.max(
                        aggregated[gameId].responseRate,
                        session.stats.responseRate
                    );
                }
                if (session.stats?.avgResponseTime !== undefined && session.stats.avgResponseTime > 0) {
                    if (aggregated[gameId].avgResponseTime > 0) {
                        aggregated[gameId].avgResponseTime =
                            (aggregated[gameId].avgResponseTime + session.stats.avgResponseTime) / 2;
                    } else {
                        aggregated[gameId].avgResponseTime = session.stats.avgResponseTime;
                    }
                }
                if (session.stats?.totalResponses !== undefined) {
                    aggregated[gameId].totalResponses += session.stats.totalResponses;
                }
                if (session.stats?.totalCalls !== undefined) {
                    aggregated[gameId].totalCalls += session.stats.totalCalls;
                }
                // Keep best first response (lower is better)
                if (session.stats?.firstResponseCall !== null && session.stats?.firstResponseCall !== undefined) {
                    if (aggregated[gameId].firstResponseCall === null ||
                        session.stats.firstResponseCall < aggregated[gameId].firstResponseCall) {
                        aggregated[gameId].firstResponseCall = session.stats.firstResponseCall;
                    }
                }
            }
        });

        return { sessions, aggregated };
    } catch (e) {
        console.error("Failed to fetch user game stats:", e);
        return { sessions: [], aggregated: {} };
    }
};

// Delete all game sessions for a user (Reset History)
export const deleteAllUserSessions = async (userId) => {
    try {
        // Query all sessions for this user
        const q = query(
            collection(db, SESSIONS_COLLECTION),
            where("userId", "==", userId)
        );

        const querySnapshot = await getDocs(q);
        const deletePromises = [];

        querySnapshot.forEach((docSnapshot) => {
            deletePromises.push(deleteDoc(doc(db, SESSIONS_COLLECTION, docSnapshot.id)));
        });

        await Promise.all(deletePromises);

        // Also clear any offline queue
        clearOfflineQueue();

        return { success: true, deletedCount: deletePromises.length };
    } catch (e) {
        console.error("Failed to delete user sessions:", e);
        throw new Error("Could not delete history. Please try again.");
    }
};
