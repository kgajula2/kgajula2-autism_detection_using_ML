import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { subscribeToAuthChanges } from "../../services/auth";
import { getUserProfile } from "../../services/db";

export const ProtectedRoute = ({ children }) => {
    const [user, setUser] = useState(undefined); // undefined = loading
    const [isOnboarded, setIsOnboarded] = useState(undefined);
    const location = useLocation();

    useEffect(() => {
        const unsubscribe = subscribeToAuthChanges(async (u) => {
            setUser(u);
            if (u) {
                const profile = await getUserProfile(u.uid);
                // Check if profile exists and has required fields
                setIsOnboarded(!!profile && !!profile.childName);
            } else {
                setIsOnboarded(false);
            }
        });
        return () => unsubscribe();
    }, []);

    if (user === undefined || isOnboarded === undefined) {
        return <div className="flex h-screen items-center justify-center text-white">Loading...</div>;
    }

    if (user === null) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // If logged in but not onboarded, redirect to /onboarding
    // But prevent infinite loop if we are already AT /onboarding
    if (!isOnboarded && location.pathname !== '/onboarding') {
        return <Navigate to="/onboarding" replace />;
    }

    // If logged in AND onboarded, but trying to access /onboarding, go home
    if (isOnboarded && location.pathname === '/onboarding') {
        return <Navigate to="/home" replace />;
    }

    return children;
};
