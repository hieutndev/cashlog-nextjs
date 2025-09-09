import "@/styles/globals.css";
import { Metadata } from "next";
import clsx from "clsx";

import { Providers } from "../components/providers/providers";

import { SITE_CONFIG } from "@/configs/site-config";
import AppLayout from "@/components/shared/layouts/app-layout";
import Script from "next/script";

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
			<head>
				<Script
					src="https://www.googletagmanager.com/gtag/js?id=G-0C8GCSM6GP"
					strategy="afterInteractive"
				/>
				<Script id="google-analytics" strategy="afterInteractive">
					{`
						window.dataLayer = window.dataLayer || [];
						function gtag(){dataLayer.push(arguments);}
						gtag('js', new Date());
						gtag('config', 'G-0C8GCSM6GP');
					`}
				</Script>
			</head>
			<body className={clsx("min-h-screen")}>
				<Providers themeProps={{ defaultTheme: "light" }}>
					<AppLayout>{children}</AppLayout>
				</Providers>
			</body>
		</html>
	);
}
