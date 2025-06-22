"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import clsx from "clsx";

import { SETTING_MENU } from "@/config/site-config";
import useScreenSize from "@/hooks/useScreenSize";
import { BREAK_POINT } from "@/config/break-point";

export default function SettingMenu() {
	const pathname = usePathname();
	const router = useRouter();

	const { width } = useScreenSize();

	const isActive = (urls: string[]) => {
		return urls.some((pattern) => {
			try {
				const regex = new RegExp(pattern.endsWith("$") ? pattern : `${pattern}$`);

				return regex.test(pathname);
			} catch {
				return false;
			}
		});
	};

	return (
		<div
			className={clsx("flex flex-col gap-4 border-gray-200", {
				"col-span-2 w-full max-w-48 border-r pr-4": width >= BREAK_POINT.L,
				"col-span-12 w-full border-b pb-4": width < BREAK_POINT.L,
			})}
		>
			{SETTING_MENU.map((button) => (
				<Button
					key={button.key}
					fullWidth
					className="justify-start"
					color={isActive(button.urls) ? "primary" : "default"}
					size="lg"
					startContent={button.icon}
					variant="light"
					onPress={() => router.push(button.key)}
				>
					{button.label[button.label.length - 1]}
				</Button>
			))}
		</div>
	);
}
