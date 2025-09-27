"use client";

import { Spinner } from "@heroui/spinner";

import Container from "@/components/shared/container/container";

export default function AppIndexPage() {

	return (
		<Container
			shadow
			className={"w-full h-full flex justify-center items-center rounded-2xl"}
			orientation={"vertical"}
		>
			<Spinner />
		</Container>
	)
}
