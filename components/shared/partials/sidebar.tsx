"use client";

import { Button } from "@heroui/button";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { Tooltip } from "@heroui/tooltip";
import { useEffect } from "react";
import clsx from "clsx";

import { SITE_CONFIG } from "@/config/site-config";
import useScreenSize from "@/hooks/useScreenSize";
import { BREAK_POINT } from "@/config/break-point";

export const Sidebar = () => {
	const { width } = useScreenSize();

	const pathname = usePathname();

	const router = useRouter();

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
		console.log("width > BREAK_POINT.L", width, width > BREAK_POINT.L);
	}, [width]);

	return (
		<div
			className={clsx("top-0 left-0 h-full px-4 py-8 flex flex-col gap-8 items-center shadow-lg", {
				"w-full": width > BREAK_POINT.XL,
				"w-max": width <= BREAK_POINT.XL,
			})}
		>
			<Image
				alt={"logo"}
				className={clsx("w-full", {
					"max-w-64": width > BREAK_POINT.XL,
					"max-w-16": width <= BREAK_POINT.XL,
				})}
				height={600}
				src={width > BREAK_POINT.XL ? "/cashlog_icontext_horizontal.png" : "/cashlog_icon.png"}
				width={1200}
			/>
			<div
				className={clsx("w-full flex flex-col gap-4", {
					"items-center": width <= BREAK_POINT.XL,
				})}
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
		</div>
	);
};
