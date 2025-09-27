"use client";
import { Spinner } from "@heroui/spinner";
import clsx from "clsx";
import { useWindowSize } from "hieutndev-toolkit";

import { useAuth } from "../../providers/auth-provider";

import { Sidebar } from "@/components/shared/partials/sidebar";
import HorizontalNav from "@/components/shared/partials/horizontal-nav";
import { BREAK_POINT } from "@/configs/break-point";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
	const { width } = useWindowSize();

	const { detecting } = useAuth();

	return (
		<div className={"w-screen h-screen flex flex-col"}>
			<div
				className={clsx("w-screen h-full", {
					"grid grid-cols-12": width > BREAK_POINT.XL,
					flex: width <= BREAK_POINT.XL,
				})}
			>
				<div
					className={clsx("relative h-100", {
						"col-span-2": width > BREAK_POINT.XL,
						"w-max": width <= BREAK_POINT.XL,
						hidden: width <= BREAK_POINT.LG,
					})}
				>
					<Sidebar />
				</div>
				<div
					className={clsx("flex flex-col gap-4 max-h-screen overflow-auto", {
						"col-span-10": width > BREAK_POINT.XL,
						"w-full": width <= BREAK_POINT.XL,
					})}
				>
					<HorizontalNav />
					<div
						className={clsx({
							"px-8 pb-8": width >= BREAK_POINT.XL,
							"px-4 pb-4": width < BREAK_POINT.XL && width >= BREAK_POINT.MD,
							"px-2 pb-2": width < BREAK_POINT.MD,
						})}
					>
						{detecting ? (
							<div className={"w-full h-full flex items-center justify-center"}>
								<Spinner size={"lg"} />
							</div>
						) : (
							children
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
