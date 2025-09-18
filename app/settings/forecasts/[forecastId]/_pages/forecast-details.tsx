"use client";
import clsx from "clsx";
import { getKeyValue, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/table";
import moment from "moment";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";

import ICONS from "@/configs/icons";
import { TForecastWithDetailAndCard } from "@/types/forecast";
import { SITE_CONFIG } from "@/configs/site-config";

interface DetailBlockProps {
	icon: React.ReactNode;
	label: string;
	value: React.ReactNode;
	color?: string;
}

function DetailBlock({ icon, label, value, color }: DetailBlockProps) {
	// Map color prop to heroui color classes
	const colorMap: Record<string, string> = {
		primary: "bg-primary/20 text-primary",
		secondary: "bg-secondary/20 text-secondary",
		success: "bg-success/20 text-success",
		warning: "bg-warning/20 text-warning",
		danger: "bg-danger/20 text-danger",
		info: "bg-info/20 text-info",
		default: "bg-default/40 text-default-800",
	};

	// Fallback to default if color is not provided or not in colorMap
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

interface ForecastDetailsProps {
	forecastDetails: TForecastWithDetailAndCard | null;
	transactions: TForecastWithDetailAndCard[];
	loadingForecast: boolean;
}

export default function ForecastDetails({
	forecastDetails,
	transactions,
	loadingForecast = true,
}: ForecastDetailsProps) {
	// const [editMode, setEditMode] = useState<boolean>(false);

	const tableColumns = [
		{ key: "times", label: "Times" },
		{ key: "transaction_date", label: "Transaction Date" },
		{ key: "transaction_amount", label: "Transaction Amount" },
		{ key: "status", label: "Status" },
	];

	return (
		<section className={"w-full flex flex-col gap-8"}>
			<div className={"flex flex-col gap-4"}>
				<p className={"text-2xl font-semibold capitalize text-default-500 text-center"}>Details</p>
				<div className={"w-full flex justify-center gap-32"}>
					<DetailBlock
						color={"secondary"}
						icon={ICONS.DOLLAR.LG}
						label={"Amount"}
						value={`${forecastDetails?.amount.toLocaleString() ?? 0}${SITE_CONFIG.CURRENCY_STRING}`}
					/>
					<DetailBlock
						color={"warning"}
						icon={ICONS.DOLLAR.LG}
						label={"Date"}
						value={
							forecastDetails?.forecast_date
								? moment(forecastDetails.forecast_date).format("DD-MM-YYYY")
								: "-"
						}
					/>
				</div>
			</div>
			<div className={"flex flex-col gap-4"}>
				<p className={"text-2xl font-semibold capitalize text-default-500 text-center"}>
					Forecast Transactions
				</p>
				<Table>
					<TableHeader>
						{tableColumns.map((col) => (
							<TableColumn
								key={col.key}
								align={["times", "transaction_date"].includes(col.key) ? "start" : "center"}
							>
								{col.label}
							</TableColumn>
						))}
					</TableHeader>
					<TableBody
						emptyContent={
							loadingForecast ? (
								<div className="flex justify-center items-center py-8">
									<Spinner
										color="primary"
										size="lg"
									>
										Loading
									</Spinner>
								</div>
							) : (
								"No data"
							)
						}
					>
						{transactions.map((tx, idx) => (
							<TableRow key={tx.transaction_id}>
								{tableColumns.map((col) => {
									const value = getKeyValue(tx, col.key);

									switch (col.key) {
										case "times":
											return <TableCell key={col.key}>#{idx + 1}</TableCell>;
										case "transaction_date":
											return (
												<TableCell key={col.key}>
													{value ? moment(value).format("DD-MM-YYYY") : "-"}
												</TableCell>
											);
										case "transaction_amount":
											return (
												<TableCell key={col.key}>
													{value !== undefined && value !== null
														? `${value.toLocaleString()}{SITE_CONFIG.CURRENCY_STRING}`
														: "-"}
												</TableCell>
											);
										case "status":
											return (
												<TableCell key={col.key}>
													<Chip
														color={
															moment().isAfter(tx.transaction_date)
																? "success"
																: "warning"
														}
														variant={"flat"}
													>
														{moment().isAfter(tx.transaction_date) ? "Payed" : "Pending"}
													</Chip>
												</TableCell>
											);
										default:
											return (
												<TableCell key={col.key}>
													{value !== undefined && value !== null ? value : "-"}
												</TableCell>
											);
									}
								})}
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</section>
	);
}
