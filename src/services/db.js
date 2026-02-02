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

                    objectFixationEntropy: session.stats?.objectFixationEntropy || 0,
                    repetitionRate: session.stats?.repetitionRate || 0,
                    switchFrequency: session.stats?.switchFrequency || 0,
                    engagementTime: session.stats?.engagementTime || 0,
                    totalTaps: session.stats?.totalTaps || 0,
                    pauseCount: session.stats?.pauseCount || 0,
                };
            } else {

                aggregated[gameId].count += 1;

                if (session.score > aggregated[gameId].score) {
                    aggregated[gameId].score = session.score;
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
