"use client";

import type { ThemeProviderProps } from "next-themes";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import * as React from "react";
import { HeroUIProvider } from "@heroui/system";
import { useRouter } from "next/navigation";
import { ToastProvider } from "@heroui/toast";
import { CookiesNextProvider } from "cookies-next/client";

import { AuthProvider } from "./auth-provider";

export interface ProvidersProps {
	children: React.ReactNode;
	themeProps?: ThemeProviderProps;
}

export function Providers({ children, themeProps }: ProvidersProps) {
	const router = useRouter();

	return (
		<HeroUIProvider navigate={router.push}>
			<ToastProvider
				placement={"top-center"}
				toastOffset={16}
				toastProps={{
					color: "primary",
					variant: "flat",
					timeout: 3000,
				}}
			/>
			<NextThemesProvider {...themeProps}>
				<CookiesNextProvider pollingOptions={{ enabled: true, intervalMs: 1000 }}>
					<AuthProvider>{children}</AuthProvider>
				</CookiesNextProvider>
			</NextThemesProvider>
		</HeroUIProvider>
	);
}
