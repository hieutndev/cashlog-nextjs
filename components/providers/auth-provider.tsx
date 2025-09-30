"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useReactiveCookiesNext } from 'cookies-next';


interface AuthContextType {
    isLoggedIn: boolean;
    detecting: boolean;
}

const AuthContext = createContext<AuthContextType>({
    isLoggedIn: false,
    detecting: true
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [detecting, setDetecting] = useState(true);

    // useReactiveCookiesNext provides reactive cookie helpers (getCookie, setCookie)
    const { getCookie } = useReactiveCookiesNext();

    useEffect(() => {
        const check = () => {
            const refresh = getCookie('refresh_token');

            setIsLoggedIn(!!refresh);
            setDetecting(false);
        };

        // initial check
        check();

        // poll as a fallback to detect cookie changes (CookiesNextProvider also polls by default)
        const interval = setInterval(check, 500);

        return () => clearInterval(interval);
    }, [getCookie]);


    return (
        <AuthContext.Provider value={{ isLoggedIn, detecting }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}