"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { hasCookie } from 'cookies-next';

interface AuthContextType {
    isLoggedIn: boolean;
    detecting: boolean;
}

const AuthContext = createContext<AuthContextType>({
    isLoggedIn: false,
    detecting: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [detecting, setDetecting] = useState(true);

    useEffect(() => {
        const checkAuthStatus = async () => {
            const hasRefreshToken = await hasCookie('refresh_token');

            setIsLoggedIn(hasRefreshToken);
            setDetecting(false);
        };

        checkAuthStatus();
    }, []);

    return (
        <AuthContext.Provider value={{ isLoggedIn, detecting }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}