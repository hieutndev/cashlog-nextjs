"use client";

import { usePathname } from "next/navigation";

import NonAuthLayout from "./nonauth-layout";
import AuthLayout from "./auth-layout";

import { SITE_CONFIG } from "@/configs/site-config";
import { useAuth } from "@/components/providers/auth-provider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();

	const { isLoggedIn } = useAuth();

	if (!isLoggedIn) {
		return <NonAuthLayout>{children}</NonAuthLayout>;
	} else {
		if (SITE_CONFIG.NON_AUTH_URLS.includes(pathname)) {
			return <NonAuthLayout>{children}</NonAuthLayout>;
		}

		return <AuthLayout>{children}</AuthLayout>;
	}
}
