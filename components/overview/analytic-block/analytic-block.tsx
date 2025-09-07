import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Chip, ChipProps } from "@heroui/chip";
import clsx from "clsx";

import ICONS from "@/configs/icons";
import { Tooltip } from "@heroui/tooltip";
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

export default function AnalyticBlock({ labelIcon, label, value, color, timeRange }: AnalyticBlockProps) {
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
					<p className={clsx("text-2xl font-bold")}>{value.amount.toLocaleString()} VND</p>
					<Tooltip size={"sm"} content={`Last ${timeRange}: ${value.last.toLocaleString()} VND`}>
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
								<span className={"font-semibold"}>{value.subAmount > 0 && "+"}{value.subAmount.toLocaleString()}</span> VND last {timeRange}
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
