"use client";

import clsx from "clsx";

import useScreenSize from "@/hooks/useScreenSize";

interface ContainerProps {
	orientation?: "horizontal" | "vertical";
	gapSize?: number;
	className?: string;
	shadow?: boolean;
	children: React.ReactNode;
}

export default function Container({
	orientation = "horizontal",
	gapSize = 4,
	className,
	shadow = false,
	children,
}: ContainerProps) {
	const WrapperOrientationClass: Record<string, string> = {
		horizontal: "flex flex-row",
		vertical: "flex flex-col",
	};

	const { width } = useScreenSize();

	const WrapperGapClass: string = `gap-${gapSize}`;

	return (
		<div
			className={clsx("w-full h-full px-4 py-2 lg:p-8", WrapperOrientationClass[orientation], WrapperGapClass, className, {
				"shadow-lg": shadow,
			})}
		>
			{children}
		</div>
	);
}
