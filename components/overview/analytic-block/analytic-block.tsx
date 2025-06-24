import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Chip, ChipProps } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import clsx from "clsx";

import SYS_ICONS from "@/configs/icons";
export interface AnalyticBlockProps {
	labelIcon: React.ReactNode;
	label: string;
	value: {
		amount: number;
		percentage: number;
		subAmount: number;
		last: number;
		cashFlow: "up" | "down";
		cashFlowWarning: "up" | "down";

		icon: React.ReactNode;
	};
	color: ChipProps["color"];
	timeRange: string;
}

export default function AnalyticBlock({ labelIcon, label, value, color, timeRange }: AnalyticBlockProps) {
	return (
		<Card shadow={"sm"}>
			<CardBody className={"flex flex-col gap-4 pt-4"}>
				<div className={"flex items-center justify-between"}>
					<div className={"flex items-center gap-2"}>
						<Chip
							color={color}
							variant={"flat"}
						>
							{labelIcon}
						</Chip>
						<p>{label}</p>
					</div>
					{/* <div>
						<Button
							isIconOnly
							variant={"light"}
						>
							{SYS_ICONS.ELLIPSIS.MD}
						</Button>
					</div> */}
				</div>
				<div className={"flex flex-col gap-2"}>
					<p className={clsx("text-2xl font-semibold")}>{value.amount.toLocaleString()} VND</p>
					<div className={"flex items-center gap-1"}>
						<Chip
							color={value.cashFlowWarning === "up" ? "success" : "danger"}
							startContent={value.icon}
							variant={"light"}
						>
							{value.percentage.toFixed(2)}%
						</Chip>
						<p
							className={clsx(
								"text-sm text-default"
								// 	{
								// 	"text-success/70": value.cashFlowWarning === "up",
								// 	"text-danger/70": value.cashFlowWarning === "down",
								// }
							)}
						>
							{value.subAmount.toLocaleString()} VND last {timeRange}
						</p>
					</div>
				</div>
				<Divider />
				<div className={"flex justify-end"}>
					<Button
						color={"default"}
						variant={"light"}
					>
						View Details {SYS_ICONS.NEXT.MD}
					</Button>
				</div>
			</CardBody>
		</Card>
	);
}
