"use client";

import { addToast } from "@heroui/toast";
import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/table";
import { Button } from "@heroui/button";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Chip } from "@heroui/chip";
import clsx from "clsx";
import { Spinner } from "@heroui/spinner";
import { useWindowSize } from "hieutndev-toolkit";
import moment from "moment";

import { useRecurringSettingsEndpoint } from "@/hooks/useRecurringSettingsEndpoint";
import { TRecurringResponse } from "@/types/recurring";
import { getBankLogo } from "@/configs/bank";
import { TBankCode } from "@/types/bank";
import ICONS from "@/configs/icons";
import { BREAK_POINT } from "@/configs/break-point";
import { SITE_CONFIG } from "@/configs/site-config";

export default function SettingRecurringPage() {
	const router = useRouter();
	const { width } = useWindowSize();
	const { useGetRecurrings, useDeleteRecurring } = useRecurringSettingsEndpoint();

	const [listRecurrings, setListRecurrings] = useState<TRecurringResponse[]>([]);
	const [selectedRecurring, setSelectedRecurring] = useState<TRecurringResponse | null>(null);

	const {
		data: fetchRecurringResult,
		loading: loadingRecurring,
		error: errorRecurring,
		fetch: fetchRecurrings,
	} = useGetRecurrings();

	useEffect(() => {
		if (fetchRecurringResult?.results) {
			setListRecurrings(fetchRecurringResult.results ?? []);
		}

		if (errorRecurring) {
			const parsedError = JSON.parse(errorRecurring);

			addToast({
				title: "Error",
				description: parsedError.message,
				color: "danger",
			});
		}
	}, [fetchRecurringResult, errorRecurring]);

	const recurringColumns = [
		{ key: "card_info", label: "Card Info" },
		{ key: "recurring_name", label: "Recurring Name" },
		{ key: "frequency", label: "Frequency" },
		{ key: "amount", label: "Amount" },
		{ key: "next_date", label: "Next Date" },
		{ key: "status", label: "Status" },
		{ key: "action", label: "Action" },
	];

	const {
		data: deleteResult,
		error: deleteError,
		fetch: deleteRecurring,
	} = useDeleteRecurring(selectedRecurring?.recurring_id ?? -1, false, true);

	useEffect(() => {
		if (selectedRecurring) {
			deleteRecurring();
		}
	}, [selectedRecurring]);

	useEffect(() => {
		if (deleteResult) {
			addToast({
				title: "Success",
				description: "Recurring transaction deleted successfully",
				color: "success",
			});
			fetchRecurrings();
			setSelectedRecurring(null);
		}

		if (deleteError) {
			const parsedError = JSON.parse(deleteError);

			addToast({
				title: "Error",
				description: parsedError.message,
				color: "danger",
			});
		}
	}, [deleteResult, deleteError]);

	const getStatusColor = (status: string): "success" | "warning" | "primary" | "default" => {
		switch (status) {
			case 'active':
				return 'success';
			case 'paused':
				return 'warning';
			case 'completed':
				return 'primary';
			default:
				return 'default';
		}
	};

	const formatFrequency = (frequency: string, interval: number) => {
		if (interval === 1) {
			return frequency.charAt(0).toUpperCase() + frequency.slice(1);
		}

		return `Every ${interval} ${frequency}`;
	};

	return (
		<div
			className={clsx({
				"col-span-10": width > BREAK_POINT.LG,
				"col-span-12": width <= BREAK_POINT.LG,
			})}
		>
			{loadingRecurring ? (
				<div className="flex items-center justify-center h-full">
					<Spinner size={"lg"}>Loading...</Spinner>
				</div>
			) : (
				<div className="flex flex-col gap-4">
					<div className={"flex items-center justify-between"}>
						<h3 className={"text-2xl font-semibold"}>List Recurrings</h3>
						<Button
							color={"primary"}
							startContent={ICONS.NEW.MD}
							onPress={() => router.push("/settings/recurrings/new")}
						>
							New Recurring
						</Button>
					</div>
					<Table>
						<TableHeader columns={recurringColumns}>
							{(column) => (
								<TableColumn
									key={column.key}
									align={
										["amount", "action", "frequency", "next_date", "status"].includes(column.key)
											? "center"
											: "start"
									}
								>
									{column.label}
								</TableColumn>
							)}
						</TableHeader>
						<TableBody
							emptyContent={"No recurring transactions available"}
							items={listRecurrings}
						>
							{(item) => (
								<TableRow key={item.recurring_id}>
									{recurringColumns.map((col) => {
										switch (col.key) {
											case "card_info":
												return (
													<TableCell key={col.key}>
														<div className="flex items-center gap-2">
															<Image
																alt={item.card_name || "Card"}
																className="rounded max-w-4"
																height={1200}
																src={item.bank_code ? getBankLogo(item.bank_code as TBankCode, 1) : "/1x1b.png"}
																width={1200}
															/>
															<span>{item.card_name}</span>
														</div>
													</TableCell>
												);
											case "amount":
												return (
													<TableCell key={col.key}>
														<Chip
															className={"capitalize"}
															color={item.direction === "in" ? "success" : "danger"}
															variant={"flat"}
														>
															{item.direction === "in" ? "+" : "-"}
															{item.amount?.toLocaleString()}{SITE_CONFIG.CURRENCY_STRING}
														</Chip>
													</TableCell>
												);
											case "frequency":
												return (
													<TableCell key={col.key}>
														<Chip
															className={"capitalize"}
															color={"secondary"}
															variant={"flat"}
														>
															{formatFrequency(item.frequency, item.interval)}
														</Chip>
													</TableCell>
												);
											case "next_date":
												return (
													<TableCell key={col.key}>
														{item.next_scheduled_date
															? moment(item.next_scheduled_date).format("DD-MM-YYYY")
															: "N/A"}
													</TableCell>
												);
											case "status":
												return (
													<TableCell key={col.key}>
														<Chip
															className={"capitalize"}
															color={getStatusColor(item.status)}
															variant={"flat"}
														>
															{item.status}
														</Chip>
													</TableCell>
												);
											case "recurring_name":
												return (
													<TableCell key={col.key}>
														<div>
															<p className="font-medium">{item.recurring_name}</p>
															{item.category_name && (
																<p className="text-xs text-default-500">{item.category_name}</p>
															)}
														</div>
													</TableCell>
												);
											case "action":
												return (
													<TableCell key={col.key}>
														<div className="flex justify-center gap-2">
															<Button
																isIconOnly
																color={"primary"}
																variant={"ghost"}
																onPress={() =>
																	router.push(
																		`/settings/recurrings/${item.recurring_id}`
																	)
																}
															>
																{ICONS.DETAILS.MD}
															</Button>
															<Button
																isIconOnly
																color={"danger"}
																variant={"ghost"}
																onPress={() => setSelectedRecurring(item)}
															>
																{ICONS.TRASH.MD}
															</Button>
														</div>
													</TableCell>
												);
											default:
												return <TableCell key={col.key}>{(item as any)[col.key]}</TableCell>;
										}
									})}
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>
			)}
		</div>
	);
}
