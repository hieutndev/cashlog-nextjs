"use client";

import { Button } from "@heroui/button";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { Tooltip } from "@heroui/tooltip";
import { useEffect } from "react";
import clsx from "clsx";
import { useWindowSize } from "hieutndev-toolkit";
import { useReactiveCookiesNext } from "cookies-next";

import packageJson from "../../../package.json";

import { SITE_CONFIG } from "@/configs/site-config";
import { BREAK_POINT } from "@/configs/break-point";
import ICONS from "@/configs/icons";

export const Sidebar = () => {
	const { width } = useWindowSize();

	const { getCookie, hasCookie, deleteCookie } = useReactiveCookiesNext();


	const pathname = usePathname();

	const router = useRouter();

	const handleLogout = () => {
		deleteCookie("access_token", { path: "/" });
		deleteCookie("refresh_token", { path: "/" });
		deleteCookie("username", { path: "/" });
		router.push("/sign-in");
	};

	const handlePress = (href: string) => {
		return router.push(href);
	};

	const getActiveButton = () => {
		const activeItem = SITE_CONFIG.SIDEBAR_ITEMS.find(
			(item) => item.href !== "/" && pathname.startsWith(item.href)
		);

		return activeItem ? activeItem.label : null;
	};

	useEffect(() => {
		console.log("width > BREAK_POINT.L", width, width > BREAK_POINT.LG);
	}, [width]);

	return (
		<div
			className={clsx("relative top-0 left-0 h-full px-4 py-8 flex flex-col gap-8 items-center shadow-[0_3px_10px_rgb(0,0,0,0.2)] xl:w-full w-max")}
		>
			<Image
				alt={"logo"}
				className={clsx("w-full xl:max-w-64 max-w-16")}
				height={600}
				src={width > BREAK_POINT.XL ? "/cashlog_icontext_horizontal.png" : "/cashlog_icon.png"}
				width={1200}
			/>
			<div
				className={clsx("w-full flex flex-col gap-4 items-center xl:items-start")}
			>
				{SITE_CONFIG.SIDEBAR_ITEMS.map((item) =>
					width > BREAK_POINT.XL ? (
						<Button
							key={item.label}
							fullWidth
							className={"justify-start"}
							color={getActiveButton() === item.label ? "primary" : "default"}
							size={"lg"}
							startContent={item.icon}
							variant={getActiveButton() === item.label ? "flat" : "light"}
							onPress={() => handlePress(item.href)}
						>
							{item.label}
						</Button>
					) : (
						<Tooltip
							key={item.label}
							content={item.label}
							placement={"right"}
						>
							<Button
								isIconOnly
								color={getActiveButton() === item.label ? "primary" : "default"}
								size={"lg"}
								variant={getActiveButton() === item.label ? "flat" : "light"}
								onPress={() => handlePress(item.href)}
							>
								{item.icon}
							</Button>
						</Tooltip>
					)
				)}
			</div>
			<p className="absolute w-full flex flex-col items-center gap-4 px-4 bottom-4 text-xs text-gray-500">
				<div className={"w-full flex justify-center xl:justify-between items-center gap-2"}>
					{width >= BREAK_POINT.XL && (
						<Button
							fullWidth
							className={"justify-start"}
							color={"default"}
							variant={"light"}
						>
							{hasCookie("email") ? `${getCookie("username") ?? ""}` : "Welcome!"}
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
				v{packageJson.version}
			</p>
		</div>
	);
};
