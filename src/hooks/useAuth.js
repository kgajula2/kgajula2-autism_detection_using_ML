import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

 
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

     
    const getUserId = () => user?.uid ?? null;

     
    const isAuthenticated = () => !!user;

     
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
