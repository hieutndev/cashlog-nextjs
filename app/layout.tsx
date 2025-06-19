import "@/styles/globals.css";
import { Metadata } from "next";
import clsx from "clsx";

import { Providers } from "../components/providers/providers";

import { SITE_CONFIG } from "@/config/site";
import AppLayout from "@/components/shared/layouts/app-layout";

export const metadata: Metadata = {
	title: {
		default: SITE_CONFIG.name,
		template: `%s`,
	},
	description: SITE_CONFIG.description,
	icons: {
		icon: "/favicon.ico",
	},
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html
			suppressHydrationWarning
			lang="en"
		>
			<head />
			<body className={clsx("min-h-screen")}>
				<Providers themeProps={{ defaultTheme: "light" }}>
					<AppLayout>{children}</AppLayout>
				</Providers>
			</body>
		</html>
	);
}
