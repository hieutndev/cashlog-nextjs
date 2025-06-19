"use client";

import { Button } from "@heroui/button";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";

import { SITE_CONFIG } from "@/config/site";

export const Sidebar = () => {
	const pathname = usePathname();

	const router = useRouter();

	const handlePress = (href: string) => {
		return router.push(href);
	};

	const getActiveButton = () => {
		const activeItem = SITE_CONFIG.sidebarItems.find((item) => item.href !== "/" && pathname.startsWith(item.href));

		return activeItem ? activeItem.label : null;
	};

	return (
		<div className={"w-full h-full px-4 py-8 flex flex-col gap-8 items-center shadow-lg"}>
			<Image
				alt={"logo"}
				className={"w-full max-w-64"}
				height={600}
				src={"/logow_b.png"}
				width={1200}
			/>
			<div className={"w-full flex flex-col gap-4"}>
				{SITE_CONFIG.sidebarItems.map((item) => (
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
				))}
			</div>
		</div>
	);
};
