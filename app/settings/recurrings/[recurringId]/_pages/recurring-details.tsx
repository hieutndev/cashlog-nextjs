"use client";
import clsx from "clsx";
import moment from "moment";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";

import ICONS from "@/configs/icons";
import { TRecurringResponse } from "@/types/recurring";
import { SITE_CONFIG } from "@/configs/site-config";

interface DetailBlockProps {
	icon: React.ReactNode;
	label: string;
	value: React.ReactNode;
	color?: string;
}

function DetailBlock({ icon, label, value, color }: DetailBlockProps) {
	const colorMap: Record<string, string> = {
		primary: "bg-primary/20 text-primary",
		secondary: "bg-secondary/20 text-secondary",
		success: "bg-success/20 text-success",
		warning: "bg-warning/20 text-warning",
		danger: "bg-danger/20 text-danger",
		info: "bg-info/20 text-info",
		default: "bg-default/40 text-default-800",
	};

	const colorClass = color && colorMap[color] ? colorMap[color] : colorMap["default"];

	return (
		<div className={"flex items-center gap-4 sm:flex-row flex-col"}>
			<div className={clsx("p-4 rounded-2xl", colorClass)}>{icon}</div>
			<div className={"flex flex-col text-center"}>
				<p className={"text-md text-gray-400"}>{label}</p>
				<p className={clsx("font-semibold text-lg capitalize", colorClass.split(" ")[1])}>{value}</p>
			</div>
		</div>
	);
}

interface RecurringDetailsProps {
	recurringDetails: TRecurringResponse | null;
	loadingRecurring: boolean;
}

export default function RecurringDetails({
	recurringDetails,
	loadingRecurring = true,
}: RecurringDetailsProps) {
	const formatFrequency = (frequency: string, interval: number) => {
		if (interval === 1) {
			return frequency.charAt(0).toUpperCase() + frequency.slice(1);
		}

		return `Every ${interval} ${frequency}`;
	};

	if (loadingRecurring) {
		return (
			<div className="flex justify-center items-center py-8">
				<Spinner
					color="primary"
					size="lg"
				>
					Loading
				</Spinner>
			</div>
		);
	}

	if (!recurringDetails) {
		return <div>No recurring transaction found</div>;
	}

	return (
		<section className={"w-full flex flex-col gap-8"}>
			<div className={"flex flex-col gap-4"}>
				<p className={"text-2xl font-semibold capitalize text-default-500 text-center"}>Details</p>
				<div className={"w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"}>
					<DetailBlock
						color={recurringDetails.direction === "in" ? "success" : "danger"}
						icon={ICONS.DOLLAR.LG}
						label={"Amount"}
						value={`${recurringDetails.direction === "in" ? "+" : "-"}${recurringDetails.amount.toLocaleString()}${SITE_CONFIG.CURRENCY_STRING}`}
					/>
					<DetailBlock
						color={"secondary"}
						icon={ICONS.SYNC.LG}
						label={"Frequency"}
						value={formatFrequency(recurringDetails.frequency, recurringDetails.interval)}
					/>
					<DetailBlock
						color={"warning"}
						icon={ICONS.DATE_ASC.LG}
						label={"Start Date"}
						value={moment(recurringDetails.start_date).format("DD-MM-YYYY")}
					/>
					<DetailBlock
						color={"info"}
						icon={ICONS.CHECK_CIRCLE.LG}
						label={"Status"}
						value={recurringDetails.status}
					/>
				</div>
			</div>

			<div className={"flex flex-col gap-4"}>
				<p className={"text-2xl font-semibold capitalize text-default-500 text-center"}>Statistics</p>
				<div className={"w-full grid grid-cols-1 md:grid-cols-3 gap-4"}>
					<div className="bg-default-100 rounded-lg p-4">
						<div className="text-sm text-default-600">Total Instances</div>
						<div className="mt-1 text-2xl font-semibold">{recurringDetails.total_instances || 0}</div>
					</div>
					<div className="bg-success-50 rounded-lg p-4">
						<div className="text-sm text-success-600">Completed</div>
						<div className="mt-1 text-2xl font-semibold text-success-600">
							{recurringDetails.completed_instances || 0}
						</div>
					</div>
					<div className="bg-warning-50 rounded-lg p-4">
						<div className="text-sm text-warning-600">Pending</div>
						<div className="mt-1 text-2xl font-semibold text-warning-600">
							{(recurringDetails.total_instances || 0) - (recurringDetails.completed_instances || 0)}
						</div>
					</div>
				</div>
			</div>

			{recurringDetails.category_name && (
				<div className={"flex flex-col gap-2"}>
					<p className={"text-lg font-semibold text-default-500"}>Category</p>
					<Chip color="primary" variant="flat">
						{recurringDetails.category_name}
					</Chip>
				</div>
			)}

			{recurringDetails.end_date && (
				<div className={"flex flex-col gap-2"}>
					<p className={"text-lg font-semibold text-default-500"}>End Date</p>
					<p className="text-default-600">{moment(recurringDetails.end_date).format("DD-MM-YYYY")}</p>
				</div>
			)}

			{recurringDetails.next_scheduled_date && (
				<div className={"flex flex-col gap-2"}>
					<p className={"text-lg font-semibold text-default-500"}>Next Scheduled Date</p>
					<Chip color="warning" variant="flat">
						{moment(recurringDetails.next_scheduled_date).format("DD-MM-YYYY")}
					</Chip>
				</div>
			)}
		</section>
	);
}
