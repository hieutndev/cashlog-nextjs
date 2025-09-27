"use client";

import { BreadcrumbItem, Breadcrumbs } from "@heroui/breadcrumbs";
import { Button, ButtonProps } from "@heroui/button";
import { usePathname, useRouter } from "next/navigation";
import { useWindowSize } from "hieutndev-toolkit";

import { BREAK_POINT } from "@/configs/break-point";

export type BreadcrumbsType = {
	label: string[];
	key: string;
	customButton?: (ButtonProps & { href: string })[];
};

export type CustomClassNames = {
	title?: string;
	customButton?: string;
	breadcrumbs?: string;
};

interface ContentHeaderProps {
	title?: string;
	breadcrumbs?: BreadcrumbsType[];
	classNames?: CustomClassNames;
}

export default function ContentHeader({ title, breadcrumbs, classNames }: ContentHeaderProps) {
	const pathname = usePathname();

	const router = useRouter();

	const { width } = useWindowSize();

	// const parseBreadcrumbs = breadcrumbs?.find((_v) => _v.key === pathname);
	const parseBreadcrumbs = breadcrumbs?.find((_v) => {
		try {
			const regex = new RegExp(_v.key.endsWith("$") ? _v.key : `${_v.key}$`); // assume _v.key is a regex pattern string

			return regex.test(pathname);
		} catch {
			return false;
		}
	});

	return (
		<div className="flex flex-col gap-2">
			<div className={"w-full flex justify-between items-center gap-4"}>
				<h1 className={`text-3xl font-bold ${classNames?.title || ""}`}>{title}</h1>
				<div className={"flex gap-2"}>
					{parseBreadcrumbs?.customButton &&
						parseBreadcrumbs?.customButton.map((button, index) => (
							<Button
								key={index}
								{...button}
								className={`${button.className || ""} ${classNames?.customButton || ""}`}
								isIconOnly={width < BREAK_POINT.SM}
								onPress={() => {
									button?.href && router.push(button.href);
								}}
							>
								{width > BREAK_POINT.SM ? button.children : null}
							</Button>
						))}
				</div>
			</div>
			{parseBreadcrumbs && (
				<Breadcrumbs
					key={parseBreadcrumbs.key}
					className={classNames?.breadcrumbs}
					size={"lg"}
				>
					{parseBreadcrumbs.label.map((label, index) => (
						<BreadcrumbItem key={index}>{label}</BreadcrumbItem>
					))}
				</Breadcrumbs>
			)}
		</div>
	);
}
