 

import { useState, useEffect, useCallback } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

export function useAuthGuard() {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(true);
    const [showReAuthPrompt, setShowReAuthPrompt] = useState(false);
    const [wasAuthenticated, setWasAuthenticated] = useState(false);

    useEffect(() => {
        const auth = getAuth();

         
        if (auth.currentUser) {
            setUser(auth.currentUser);
            setIsAuthenticated(true);
            setWasAuthenticated(true);
        }

         
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                setIsAuthenticated(true);
                setWasAuthenticated(true);
                setShowReAuthPrompt(false);
            } else {
                setUser(null);
                setIsAuthenticated(false);

                 
                 
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
