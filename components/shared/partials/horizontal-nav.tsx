"use client";

import { Button } from "@heroui/button";
import { useReactiveCookiesNext } from "cookies-next/client";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";
import { useRouter } from "next/navigation";
import clsx from "clsx";

import SYS_ICONS from "@/config/icons";
import { SITE_CONFIG } from "@/config/site-config";
import useScreenSize from "@/hooks/useScreenSize";
import { BREAK_POINT } from "@/config/break-point";

export default function HorizontalNav() {
	const { getCookie, hasCookie, deleteCookie } = useReactiveCookiesNext();

	const router = useRouter();

	const { width } = useScreenSize();

	const handleLogout = () => {
		deleteCookie("access_token", { path: "/" });
		deleteCookie("refresh_token", { path: "/" });
		deleteCookie("username", { path: "/" });
	};

	return (
		<section className={"w-full flex justify-between items-center px-8 py-4 border-b"}>
			<div
				className={clsx("w-max", {
					invisible: width > BREAK_POINT.L,
				})}
			>
				<Dropdown size={"lg"}>
					<DropdownTrigger>
						<Button
							startContent={SYS_ICONS.BARS.LG}
							variant="light"
						>
							Menu
						</Button>
					</DropdownTrigger>
					<DropdownMenu
						aria-label="Navigation Menu"
						items={SITE_CONFIG.sidebarItems}
					>
						{(item) => (
							<DropdownItem
								key={item.label}
								startContent={item.icon}
								onClick={() => router.push(item.href)}
							>
								{item.label}
							</DropdownItem>
						)}
					</DropdownMenu>
				</Dropdown>
			</div>
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
					onPress={() => router.push("/sign-in")}
				>
					Login
				</Button>
			)}
		</section>
	);
}
