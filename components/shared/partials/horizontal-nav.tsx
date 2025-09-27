"use client";

import { Button } from "@heroui/button";
import { useReactiveCookiesNext } from "cookies-next/client";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { useState } from "react";
import { Navbar, NavbarContent, NavbarMenuToggle, NavbarMenu, NavbarMenuItem } from "@heroui/navbar";
import Image from "next/image";
import { useWindowSize } from "hieutndev-toolkit";

import packageJson from "../../../package.json";

import ICONS from "@/configs/icons";
import { BREAK_POINT } from "@/configs/break-point";
import { SITE_CONFIG } from "@/configs/site-config";

export default function HorizontalNav() {
	const { getCookie, hasCookie, deleteCookie } = useReactiveCookiesNext();

	const [isMenuOpen, setIsMenuOpen] = useState(false);

	const router = useRouter();

	const { width } = useWindowSize();

	const handleLogout = () => {
		deleteCookie("access_token", { path: "/" });
		deleteCookie("refresh_token", { path: "/" });
		deleteCookie("username", { path: "/" });
		router.push("/sign-in");
	};

	return (
		<section
			className={clsx("w-full flex justify-between items-center py-4 border-b", {
				"px-8": width > BREAK_POINT.LG,
				"px-4": width <= BREAK_POINT.LG,
			})}
		>
			<div
				className={clsx("w-max", {
					invisible: width > BREAK_POINT.LG,
				})}
			>
				<Navbar
					classNames={{
						wrapper: "px-4",
					}}
					isMenuOpen={isMenuOpen}
					onMenuOpenChange={setIsMenuOpen}
				>
					<NavbarContent>
						<NavbarMenuToggle aria-label={isMenuOpen ? "Close menu" : "Open menu"} />
					</NavbarContent>

					<NavbarMenu className={"mt-4"}>
						{SITE_CONFIG.SIDEBAR_ITEMS.map((item, index) => (
							<NavbarMenuItem key={`${item}-${index}`}>
								<Button
									size={"lg"}
									variant="light"
									onPress={() => {
										router.push(item.href);
										setIsMenuOpen(false); // Close the menu after navigation
									}}
								>
									{item.label}
								</Button>
							</NavbarMenuItem>
						))}
						<p className="w-full text-center absolute left-0  bottom-8 text-xs text-gray-500">
							v{packageJson.version}
						</p>
					</NavbarMenu>

				</Navbar>
			</div>
			<div
				className={clsx({
					invisible: width > BREAK_POINT.LG,
				})}
			>
				<Image
					alt={SITE_CONFIG.NAME}
					className={"max-w-[150px] h-auto"}
					height={1200}
					src={SITE_CONFIG.LOGO.HORIZONTAL}
					width={1200}
				/>
			</div>
			{hasCookie("refresh_token") ? (
				<div className={"flex items-center gap-2"}>
					{width >= BREAK_POINT.MD && (
						<Button
							color={"primary"}
							variant={"light"}
						>
							{hasCookie("email") ? `Welcome, ${getCookie("username") ?? ""}` : "Welcome!"}
						</Button>
					)}
					<Button
						isIconOnly
						color={"danger"}
						startContent={ICONS.LOGOUT.XL}
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
