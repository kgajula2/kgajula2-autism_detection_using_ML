import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { subscribeToAuthChanges } from "../../services/auth";
import { getUserProfile } from "../../services/db";

export const ProtectedRoute = ({ children }) => {
    const [user, setUser] = useState(undefined);  
    const [isOnboarded, setIsOnboarded] = useState(undefined);
    const location = useLocation();

    useEffect(() => {
        const unsubscribe = subscribeToAuthChanges(async (u) => {
            setUser(u);
            if (u) {
                const profile = await getUserProfile(u.uid);
                 
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

     
     
    if (!isOnboarded && location.pathname !== '/onboarding') {
        return <Navigate to="/onboarding" replace />;
    }

     
    if (isOnboarded && location.pathname === '/onboarding') {
        return <Navigate to="/home" replace />;
    }

    return children;
};
