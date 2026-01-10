/**
 * useAuthGuard Hook
 * 
 * Monitors Firebase auth state during gameplay and provides:
 * - Current auth status
 * - Re-authentication prompt when session expires
 * - Callbacks for auth state changes
 */

import { useState, useEffect, useCallback } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

export function useAuthGuard() {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(true);
    const [showReAuthPrompt, setShowReAuthPrompt] = useState(false);
    const [wasAuthenticated, setWasAuthenticated] = useState(false);

    useEffect(() => {
        const auth = getAuth();

        // Check initial state
        if (auth.currentUser) {
            setUser(auth.currentUser);
            setIsAuthenticated(true);
            setWasAuthenticated(true);
        }

        // Listen for auth state changes
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                setIsAuthenticated(true);
                setWasAuthenticated(true);
                setShowReAuthPrompt(false);
            } else {
                setUser(null);
                setIsAuthenticated(false);

                // Only show re-auth prompt if user WAS authenticated before
                // (i.e., session expired mid-game)
                if (wasAuthenticated) {
                    setShowReAuthPrompt(true);
                }
            }
        });

        return () => unsubscribe();
    }, [wasAuthenticated]);

    const dismissReAuthPrompt = useCallback(() => {
        setShowReAuthPrompt(false);
    }, []);

    const getUserId = useCallback(() => {
        return user?.uid || null;
    }, [user]);

    return {
        user,
        isAuthenticated,
        showReAuthPrompt,
        dismissReAuthPrompt,
        getUserId,
    };
}

export default useAuthGuard;
