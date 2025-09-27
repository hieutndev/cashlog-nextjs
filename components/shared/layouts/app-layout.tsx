"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { hasCookie } from "cookies-next";

import NonAuthLayout from "./nonauth-layout";
import AuthLayout from "./auth-layout";

import { SITE_CONFIG } from "@/configs/site-config";

export default function AppLayout({ children }: { children: React.ReactNode }) {
	const router = useRouter();
	const pathname = usePathname();

	const isNonAuthRoute = SITE_CONFIG.NON_AUTH_URLS.includes(pathname);

	useEffect(() => {
		const checkAuthAndRedirect = async () => {
			const hasRefreshToken = await hasCookie("refresh_token");

			if (isNonAuthRoute) {
				if (pathname === "/sign-in" && hasRefreshToken) {
					router.push("/overview");
				}
			} else {
				if (!hasRefreshToken) {
					router.push("/sign-in");
				}
			}
		};

		checkAuthAndRedirect();
	}, [pathname, isNonAuthRoute, router]);

	// Choose layout based on route type
	if (isNonAuthRoute) {
		return <NonAuthLayout>{children}</NonAuthLayout>;
	} else {
		return <AuthLayout>{children}</AuthLayout>;
	}
}
