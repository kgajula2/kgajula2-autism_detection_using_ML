import { db } from "./firebase";
import {
    query,
    where,
    getDocs,
    orderBy,
    limit,
    collection,
    addDoc,
    updateDoc,
    doc,
    serverTimestamp,
    getDoc,
    setDoc
} from "firebase/firestore";

// Collection references
const USERS_COLLECTION = "users";
const SESSIONS_COLLECTION = "game_sessions";
const METRICS_COLLECTION = "round_metrics";

// Local storage key for offline queue
const OFFLINE_QUEUE_KEY = 'neurostep_offline_queue';

/**
 * Get any pending offline data
 */
const getOfflineQueue = () => {
    try {
        const data = localStorage.getItem(OFFLINE_QUEUE_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
};

/**
 * Add item to offline queue
 */
const addToOfflineQueue = (type, data) => {
    try {
        const queue = getOfflineQueue();
        queue.push({ type, data, timestamp: Date.now() });
        localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    } catch (e) {
        console.error("Failed to save to offline queue", e);
    }
};

/**
 * Clear offline queue
 */
const clearOfflineQueue = () => {
    try {
        localStorage.removeItem(OFFLINE_QUEUE_KEY);
    } catch (e) {
        console.error("Failed to clear offline queue", e);
    }
};

/**
 * Sync offline queue when back online
 */
export const syncOfflineQueue = async () => {
    const queue = getOfflineQueue();
    if (queue.length === 0) return;

    console.log(`📤 Syncing ${queue.length} offline items...`);
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
        console.log("✅ Offline sync complete");
    } else {
        console.error("⚠️ Some items failed to sync", errors);
    }
};

// Basic Profile Operations
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

        // Offline fallback - generate local ID and queue for sync
        const localId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        addToOfflineQueue('session_start', {
            ...sessionData,
            startTime: new Date().toISOString(),
            localId
        });

        console.log("📴 Session queued for offline sync");
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

        // Offline fallback
        addToOfflineQueue('metrics', {
            ...metricsData,
            timestamp: new Date().toISOString()
        });
    }
};

export const endGameSession = async (sessionId, finalScore, stats) => {
    // Skip if it's a local session (will be synced later)
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

        // Offline fallback
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
        // Fetch last 50 completed sessions for stats
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

        // Sort in memory to avoid needing a composite index
        sessions.sort((a, b) => {
            const timeA = a.endTime?.seconds || 0;
            const timeB = b.endTime?.seconds || 0;
            return timeB - timeA; // Descending
        });

        // Aggregate by game
        const aggregated = {};
        sessions.forEach(session => {
            if (!aggregated[session.gameId]) {
                aggregated[session.gameId] = {
                    score: 0,
                    count: 0,
                    ...session.stats
                };
            }
            aggregated[session.gameId].score = Math.max(aggregated[session.gameId].score, session.score);
            aggregated[session.gameId].count += 1;
        });

        return { sessions, aggregated };
    } catch (e) {
        console.error("Failed to fetch user game stats:", e);
        return { sessions: [], aggregated: {} };
    }
};
