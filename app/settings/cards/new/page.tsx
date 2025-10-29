"use client";

import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";

import CardForm from "@/components/cards/card-form";
import ICONS from "@/configs/icons";

export default function NewCardPage() {
	const router = useRouter();

	const handleSuccess = () => {
		router.push("/settings/cards");
	};

	return (
		<div className={"flex flex-col gap-4 col-span-12 lg:col-span-10"}>
			<div className={"flex items-center justify-between"}>
				<h3 className={"text-2xl font-semibold"}>New Card</h3>
				<Button
					color={"primary"}
					startContent={ICONS.BACK.MD}
					onPress={() => router.push("/settings/cards")}
				>
					Back
				</Button>
			</div>
			<CardForm mode="create" onSuccess={handleSuccess} />
		</div>
	);
}
