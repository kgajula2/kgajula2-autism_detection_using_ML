import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

/**
 * Custom hook for centralized authentication state management.
 * Replaces scattered getAuth().currentUser?.uid patterns across the app.
 * 
 * @returns {Object} Authentication state and helper functions
 */
export function useAuth() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const auth = getAuth();

        const unsubscribe = onAuthStateChanged(
            auth,
            (firebaseUser) => {
                setUser(firebaseUser);
                setLoading(false);
                setError(null);
            },
            (err) => {
                console.error('Auth state change error:', err);
                setError(err);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    /**
     * Get user ID safely
     * @returns {string|null} User ID or null if not authenticated
     */
    const getUserId = () => user?.uid ?? null;

    /**
     * Check if user is authenticated
     * @returns {boolean}
     */
    const isAuthenticated = () => !!user;

    /**
     * Execute a callback only if authenticated
     * @param {Function} callback - Function to execute with userId
     * @returns {Promise<any>} Result of callback or null
     */
    const withAuth = async (callback) => {
        const userId = getUserId();
        if (!userId) {
            console.warn('withAuth: No authenticated user');
            return null;
        }
        try {
            return await callback(userId);
        } catch (err) {
            console.error('withAuth callback error:', err);
            setError(err);
            return null;
        }
    };

    return {
        user,
        userId: user?.uid ?? null,
        loading,
        error,
        isAuthenticated,
        getUserId,
        withAuth,
    };
}

export default useAuth;
