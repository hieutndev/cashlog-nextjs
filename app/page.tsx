"use client";

import { Spinner } from "@heroui/spinner";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import Container from "@/components/shared/container/container";
import { useAuth } from "@/components/providers/auth-provider";

export default function AppIndexPage() {
	const { isLoggedIn, detecting } = useAuth();

	const router = useRouter();

	useEffect(() => {
		if (!detecting) {
			if (isLoggedIn) {
				router.push("/overview");
			} else {
				router.push("/sign-in");
			}
		}
	}, [isLoggedIn, detecting]);

	return (
		isLoggedIn && (
			<Container
				shadow
				className={"w-full h-full flex justify-center items-center rounded-2xl"}
				orientation={"vertical"}
			>
				<Spinner />
			</Container>
		)
	);
}
