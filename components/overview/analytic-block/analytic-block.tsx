import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Chip, ChipProps } from "@heroui/chip";
import clsx from "clsx";
import { Tooltip } from "@heroui/tooltip";

import ICONS from "@/configs/icons";
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
			<CardBody className={"flex flex-col gap-2 pt-2 pb-4"}>
				<div className={"flex items-center justify-between"}>
					<div className={"flex items-center gap-2"}>
						<p>{label}</p>
					</div>
					<div>
						<Button
							isIconOnly
							variant={"light"}
						>
							{ICONS.ELLIPSIS.MD}
						</Button>
					</div>
				</div>
				<div className={"flex flex-col gap-2"}>
					<p className={clsx("text-2xl font-bold")}>{value.amount.toLocaleString()}{SITE_CONFIG.CURRENCY_STRING}</p>
					<Tooltip content={`Last ${timeRange}: ${value.last.toLocaleString()}${SITE_CONFIG.CURRENCY_STRING}`} size={"sm"}>
						<div className={"flex items-center gap-1"}>

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
				{/* <Divider />
				<div className={"flex justify-end"}>
					<Button
						color={"default"}
						variant={"light"}
					>
						View Details {ICONS.NEXT.MD}
					</Button>
				</div> */}
			</CardBody>
		</Card >
	);
}
