"use client";

import { Button } from "@heroui/button";
import { useDisclosure } from "@heroui/modal";
import { useReactiveCookiesNext } from "cookies-next/client";

import AuthModal from "@/components/auth/auth-modal";
import SYS_ICONS from "@/config/icons";

export default function HorizontalNav() {
	const { getCookie, hasCookie, deleteCookie } = useReactiveCookiesNext();

	const { isOpen, onOpen, onClose } = useDisclosure();

	const handleLogout = () => {
		deleteCookie("access_token", { path: "/" });
		deleteCookie("refresh_token", { path: "/" });
		deleteCookie("username", { path: "/" });
	};

	return (
		<section className={"w-full flex justify-end items-center px-8 py-4 border-b"}>
			{hasCookie("refresh_token") ? (
				<div className={"flex items-center gap-2"}>
					<Button
						color={"primary"}
						variant={"light"}
					>
						{hasCookie("email") ? `Welcome, ${getCookie("username") ?? ""}` : "Welcome!"}
					</Button>
					<Button
						isIconOnly
						color={"danger"}
						startContent={SYS_ICONS.LOGOUT.XL}
						variant={"light"}
						onPress={() => handleLogout()}
					/>
				</div>
			) : (
				<Button
					color={"primary"}
					onPress={onOpen}
				>
					Login
				</Button>
			)}
			<AuthModal
				isOpen={isOpen}
				onClose={onClose}
			/>
		</section>
	);
}
