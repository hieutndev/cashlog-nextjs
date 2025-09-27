import { Card, CardBody } from "@heroui/card";
import { Chip, ChipProps } from "@heroui/chip";
import clsx from "clsx";
import { Tooltip } from "@heroui/tooltip";

import { SITE_CONFIG } from "@/configs/site-config";
export interface AnalyticBlockProps {
	labelIcon: React.ReactNode;
	label: string;
	value: {
		amount: number;
		percentage: number;
		subAmount: number;
		last: number;
		cashFlow: "neutral" | "up" | "down";
		cashFlowWarning: "neutral" | "up" | "down";
		icon: React.ReactNode;
	};
	color: ChipProps["color"];
	timeRange: string;
}

export default function AnalyticBlock({ label, value, timeRange }: AnalyticBlockProps) {
	return (
		<Card shadow={"sm"}>
			<CardBody className={"flex flex-col lg:gap-2 gap-4 pt-2 pb-4"}>
				<div className={"flex items-center justify-between"}>
					<div className={"w-full flex items-center gap-2"}>
						<p className={"w-full text-center lg:text-left"}>{label}</p>
					</div>
					{/* <div>
						<Button
							isIconOnly
							variant={"light"}
						>
							{ICONS.ELLIPSIS.MD}
						</Button>
					</div> */}
				</div>
				<div className={"w-full flex flex-col lg:gap-2 gap-4"}>
					<p className={clsx("w-full text-center lg:text-left text-2xl font-bold")}>{value.amount.toLocaleString()}{SITE_CONFIG.CURRENCY_STRING}</p>
					<Tooltip content={`Last ${timeRange}: ${value.last.toLocaleString()}${SITE_CONFIG.CURRENCY_STRING}`} size={"sm"}>
						<div className={"flex items-center justify-center lg:justify-start gap-1 xl:flex-wrap"}>
							<Chip
								className={"text-xs"}
								color={value.cashFlowWarning === "neutral"
									? "primary"
									: value.cashFlowWarning === "up"
										? "success"
										: "danger"}
								startContent={value.icon}
								variant={"light"}
							>
								{value.percentage > 0 && "+"}{value.percentage.toFixed(2)}%
							</Chip>
							<p
								className={clsx(
									"text-xs text-default"
								)}
							>
								<span className={"font-semibold"}>{value.subAmount > 0 && "+"}{value.subAmount.toLocaleString()}</span>{SITE_CONFIG.CURRENCY_STRING} last {timeRange}
							</p>
						</div>
					</Tooltip>
				</div>
			</CardBody>
		</Card >
	);
}
