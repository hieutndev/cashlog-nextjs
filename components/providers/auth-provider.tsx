"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useReactiveCookiesNext } from "cookies-next/client";
import { usePathname } from "next/navigation";

import { useFetch } from "@/hooks/useFetch";
import { IAPIResponse } from "@/types/global";

interface IAuthContext {
	isLoggedIn: boolean | null;
	detecting: boolean;
}

const AuthContext = createContext<IAuthContext>({ isLoggedIn: null, detecting: true });

export function useAuth() {
	return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const { getCookie, deleteCookie } = useReactiveCookiesNext();
	const [isLoggedIn, setIsLoggedIn] = useState<null | boolean>(null);
	const [detecting, setDetecting] = useState(true);


	const { data: checkSessionResult, fetch: checkSession } = useFetch<IAPIResponse>(`/users/check-sessions`, {
		method: 'POST',
		body: {
			refresh_token: getCookie("refresh_token")
		},
		skip: true,
	});

	useEffect(() => {
		
		console.log("🚀 ~ AuthProvider ~ checkSessionResult:", checkSessionResult)
		if (checkSessionResult && checkSessionResult.status !== "success") {
			console.log(checkSessionResult.status);
			
			deleteCookie("access_token", { path: "/" });
			deleteCookie("refresh_token", { path: "/" });
			deleteCookie("username", { path: "/" });
		}
	}, [checkSessionResult]);

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
			checkSession({
				body: {
					refresh_token: getCookie("refresh_token")
				},
			})
			setDetecting(false);
		}
	}, [isLoggedIn]);

	useEffect(() => {
		setDetecting(true);
	}, [pathname]);

	return <AuthContext.Provider value={{ isLoggedIn, detecting }}>{children}</AuthContext.Provider>;
}
