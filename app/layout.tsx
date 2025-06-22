import "@/styles/globals.css";
import { Metadata } from "next";
import clsx from "clsx";

import { Providers } from "../components/providers/providers";

import { SITE_CONFIG } from "@/config/site-config";
import AppLayout from "@/components/shared/layouts/app-layout";

export const metadata: Metadata = {
	title: {
		default: SITE_CONFIG.NAME,
		template: `%s`,
	},
	description: SITE_CONFIG.DESCRIPTION,
	icons: {
		icon: SITE_CONFIG.FAVICON,
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
