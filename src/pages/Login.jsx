import { useState, useEffect } from 'react';
import { Card } from "../components/ui/Card";
import { Title, SubTitle } from "../components/ui/Typography";
import { Button } from "../components/ui/Button";
import { getAuth, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider } from "firebase/auth";
import { app } from "../services/firebase";
import { useNavigate } from "react-router-dom";
import { createUserProfile } from "../services/db";
import { useUserStore } from "../store/userStore";

 
const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const Login = () => {
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const auth = getAuth(app);
    const provider = new GoogleAuthProvider();
    const { user } = useUserStore();

     
    useEffect(() => {
        const handleRedirectResult = async () => {
            try {
                const result = await getRedirectResult(auth);
                if (result) {
                    const user = result.user;
                    await createUserProfile(user.uid, {
                        email: user.email,
                        displayName: user.displayName,
                        photoURL: user.photoURL,
                        lastLogin: new Date()
                    });
                    navigate('/home');
                }
            } catch (err) {
                console.error("Redirect result error:", err);
                setError(err.message);
            }
        };
        handleRedirectResult();
    }, [auth, navigate]);

    useEffect(() => {
        if (user) {
            navigate('/home');
        }
    }, [user, navigate]);

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError(null);

        try {
            if (isMobile()) {
                 
                await signInWithRedirect(auth, provider);
                 
            } else {
                 
                const result = await signInWithPopup(auth, provider);
                const user = result.user;

                await createUserProfile(user.uid, {
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                    lastLogin: new Date()
                });

                navigate('/home');
            }
        } catch (err) {
            console.error(err);
             
            if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/popup-blocked') {
                setError("Popup was blocked. Trying redirect method...");
                try {
                    await signInWithRedirect(auth, provider);
                } catch (redirectErr) {
                    setError(redirectErr.message);
                }
            } else {
                setError(`Firebase Error (${err.code}): ${err.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <Card glass className="p-8 w-full max-w-md text-center">
                <Title className="mb-4">Welcome Back</Title>
                <SubTitle className="mb-6">Sign in to NeuroStep to save your progress.</SubTitle>

                {error && (
                    <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded mb-4 text-sm">
                        {error}
                    </div>
                )}

                <Button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <span className="animate-spin">⏳</span>
                    ) : (
                        <svg className="w-5 h-5 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                    )}
                    {loading ? 'Signing in...' : 'Sign in with Google'}
                </Button>

                {isMobile() && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                        You'll be redirected to Google for secure sign-in
                    </p>
                )}
            </Card>
        </div>
    );
};

