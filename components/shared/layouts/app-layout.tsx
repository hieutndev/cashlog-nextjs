"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import NonAuthLayout from "./nonauth-layout";
import AuthLayout from "./auth-layout";

import { useAuth } from "@/components/providers/auth-provider";
import { SITE_CONFIG } from "@/config/site";

export default function AppLayout({ children }: { children: React.ReactNode }) {
	const { isLoggedIn, detecting } = useAuth();

	const router = useRouter();

	const pathname = usePathname();

	useEffect(() => {
		if (!detecting && !isLoggedIn) {
			if (!SITE_CONFIG.nonAuthUrls.includes(pathname)) {
				return router.push("/sign-in");
			}
		} else if (!detecting && isLoggedIn) {
			if (SITE_CONFIG.nonAuthUrls.includes(pathname)) {
				return router.push("/");
			}
		}
	}, [detecting, isLoggedIn]);

	if (!isLoggedIn) {
		return <NonAuthLayout>{children}</NonAuthLayout>;
	} else {
		return <AuthLayout>{children}</AuthLayout>;
	}
}
