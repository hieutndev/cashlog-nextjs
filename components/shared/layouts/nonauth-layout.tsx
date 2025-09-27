"use client";

import { Spinner } from "@heroui/spinner";

import { useAuth } from "../../providers/auth-provider";

export default function NonAuthLayout({ children }: { children: React.ReactNode }) {
	const { detecting } = useAuth();

	return (
		<div className={"w-screen h-screen"}>
			{detecting ? (
				<div className={"w-full h-full flex items-center justify-center"}>
					<Spinner size={"lg"} />
				</div>
			) : (
				children
			)}
		</div>
	);
}
