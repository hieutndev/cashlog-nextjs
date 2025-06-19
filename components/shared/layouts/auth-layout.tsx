"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Spinner } from "@heroui/spinner";

import { Sidebar } from "@/components/shared/partials/sidebar";
import HorizontalNav from "@/components/shared/partials/horizontal-nav";
import { useAuth } from "@/components/providers/auth-provider";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
	const { isLoggedIn, detecting } = useAuth();

	const router = useRouter();

	useEffect(() => {
		if (!isLoggedIn) {
			// Redirect to dashboard or home page if already signed in
			router.push("/sign-in"); // Adjust the path as needed
		}
	}, [isLoggedIn]);

	return (
		<div className={"w-screen h-screen flex flex-col"}>
			<div className={"w-full h-full grid grid-cols-12"}>
				<div className={"col-span-2"}>
					<Sidebar />
				</div>
				<div className={"col-span-10 flex flex-col gap-4"}>
					<HorizontalNav />
					<div className={"px-8 pb-8"}>
						{detecting ? (
							<div className={"w-full h-full flex items-center justify-center"}>
								<Spinner size={"lg"} />
							</div>
						) : (
							children
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
