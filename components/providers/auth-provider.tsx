"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useReactiveCookiesNext } from "cookies-next/client";
import { usePathname } from "next/navigation";

interface IAuthContext {
	isLoggedIn: boolean | null;
	detecting: boolean;
}

const AuthContext = createContext<IAuthContext>({ isLoggedIn: null, detecting: true });

export function useAuth() {
	return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const { getCookie } = useReactiveCookiesNext();
	const [isLoggedIn, setIsLoggedIn] = useState<null | boolean>(null);
	const [detecting, setDetecting] = useState(true);

	const pathname = usePathname();

	useEffect(() => {
		setDetecting(true);
		const refreshToken = getCookie("refresh_token");

		setIsLoggedIn(!!refreshToken);
		setDetecting(false);
	}, [getCookie]);

	useEffect(() => {
		if (isLoggedIn === null) {
			setDetecting(true);
		} else {
			setDetecting(false);
		}
	}, [isLoggedIn]);

	useEffect(() => {
		console.log("AuthProvider - Pathname changed:", pathname);

		setDetecting(true);
	}, [pathname]);

	return <AuthContext.Provider value={{ isLoggedIn, detecting }}>{children}</AuthContext.Provider>;
}
