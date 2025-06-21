"use client";

import { Button } from "@heroui/button";
import { useReactiveCookiesNext } from "cookies-next/client";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { useState } from "react";
import { Navbar, NavbarContent, NavbarMenuToggle, NavbarMenu, NavbarMenuItem } from "@heroui/navbar";

import SYS_ICONS from "@/config/icons";
import useScreenSize from "@/hooks/useScreenSize";
import { BREAK_POINT } from "@/config/break-point";
import { SITE_CONFIG } from "@/config/site-config";

export default function HorizontalNav() {
	const { getCookie, hasCookie, deleteCookie } = useReactiveCookiesNext();

	const [isMenuOpen, setIsMenuOpen] = useState(false);

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
				{/* <Dropdown size={"lg"}>
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
				</Dropdown> */}

				<Navbar
					isMenuOpen={isMenuOpen}
					onMenuOpenChange={setIsMenuOpen}
				>
					<NavbarContent>
						<NavbarMenuToggle aria-label={isMenuOpen ? "Close menu" : "Open menu"} />
					</NavbarContent>

					<NavbarMenu className={"mt-4"}>
						{SITE_CONFIG.sidebarItems.map((item, index) => (
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
					</NavbarMenu>
				</Navbar>
			</div>
			{hasCookie("refresh_token") ? (
				<div className={"flex items-center gap-2"}>
					{width >= BREAK_POINT.M && (
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
