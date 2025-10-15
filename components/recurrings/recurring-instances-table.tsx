"use client";

import type { TRecurringInstance } from "@/types/recurring";

import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/table";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import moment from "moment";
import { useRouter } from "next/navigation";

import { SITE_CONFIG } from "@/configs/site-config";
import ICONS from "@/configs/icons";

interface RecurringInstancesTableProps {
	instances?: TRecurringInstance[];
	onSkip?: (instance: TRecurringInstance) => void;
	onCreate?: (instance: TRecurringInstance) => void;
	isSkipping?: boolean;
	isCreating?: boolean;
}

const getStatusColor = (status: string): "default" | "primary" | "secondary" | "success" | "warning" | "danger" => {
	switch (status) {
		case "completed":
			return "success";
		case "pending":
			return "warning";
		case "overdue":
			return "danger";
		case "skipped":
			return "default";
		case "modified":
			return "secondary";
		case "cancelled":
			return "danger";
		default:
			return "default";
	}
};

export default function RecurringInstancesTable({
	instances = [],
	onSkip,
	onCreate,
	isSkipping = false,
	isCreating = false
}: RecurringInstancesTableProps) {
	const router = useRouter();

	const columns = [
		{ key: "scheduled_date", label: "Scheduled Date" },
		{ key: "actual_date", label: "Actual Date" },
		{ key: "scheduled_amount", label: "Scheduled Amount" },
		{ key: "actual_amount", label: "Actual Amount" },
		{ key: "status", label: "Status" },
		{ key: "description", label: "Description" },
		{ key: "completed_at", label: "Completed At" },
		{ key: "transaction", label: "Transaction" },
		...(onSkip || onCreate ? [{ key: "actions", label: "Actions" }] : []),
	];

	return (
		<div className="w-full flex flex-col gap-4 p-4 bg-white border border-default-200 rounded-2xl shadow-lg overflow-hidden">
			<h4 className="text-lg font-semibold">Recurring Instances</h4>
			<Table
				isHeaderSticky
				removeWrapper
				aria-label="Recurring instances table"
				className={"max-h-96 overflow-auto"}
				isStriped={true}
				shadow={"md"}
			>

				<TableHeader columns={columns}>
					{(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
				</TableHeader>
				<TableBody
					emptyContent={
						<div className="text-center py-8 text-default-500">
							No recurring instances found
						</div>
					}
					items={instances}
				>
					{(instance) => (
						<TableRow key={instance.instance_id}>
							{(columnKey) => {
								switch (columnKey) {
									case "scheduled_date":
										return (
											<TableCell>
												{moment(instance.scheduled_date).format("DD-MM-YYYY")}
											</TableCell>
										);
									case "actual_date":
										return (
											<TableCell>
												{instance.actual_date
													? moment(instance.actual_date).format("DD-MM-YYYY")
													: "-"}
											</TableCell>
										);
									case "scheduled_amount":
										return (
											<TableCell>
												{instance.scheduled_amount.toLocaleString()} {SITE_CONFIG.CURRENCY_STRING}
											</TableCell>
										);
									case "actual_amount":
										return (
											<TableCell>
												{instance.actual_amount
													? `${instance.actual_amount.toLocaleString()} ${SITE_CONFIG.CURRENCY_STRING}`
													: "-"}
											</TableCell>
										);
									case "status":
										return (
											<TableCell>
												<Chip
													className="capitalize"
													color={getStatusColor(instance.status)}
													size="sm"
													variant="flat"
												>
													{instance.status}
												</Chip>
											</TableCell>
										);
									case "description":
										return (
											<TableCell>
												<div className="max-w-xs truncate text-sm text-default-600">
													{instance.status === "skipped"
														? instance.skip_reason || "-"
														: instance.notes || "-"}
												</div>
											</TableCell>
										);
									case "completed_at":
										return (
											<TableCell>
												{instance.completed_at
													? moment(instance.completed_at).format("DD-MM-YYYY HH:mm")
													: "-"}
											</TableCell>
										);
									case "transaction":
										return (
											<TableCell>
												{instance.transaction_id ? (
													<Button
														color="primary"
														size="sm"
														variant="light"
														onPress={() => router.push(`/transactions?transaction_id=${instance.transaction_id}`)}
													>
														View
													</Button>
												) : (
													<span className="text-default-400 text-sm">-</span>
												)}
											</TableCell>
										);
									case "actions":
										return (
											<TableCell>
												<div className="flex gap-1">
													{onSkip && (
														<Button
															isIconOnly
															color="warning"
															isDisabled={instance.status !== 'pending' && instance.status !== 'overdue'}
															isLoading={isSkipping}
															size="sm"
															title="Skip"
															variant="flat"
															onPress={() => onSkip(instance)}
														>
															{ICONS.XMARK.MD}
														</Button>
													)}
													{onCreate && (
														<Button
															isIconOnly
															color="primary"
															isDisabled={instance.status !== 'pending' && instance.status !== 'overdue'}
															isLoading={isCreating}
															size="sm"
															title="Create Transaction"
															variant="flat"
															onPress={() => onCreate(instance)}
														>
															{ICONS.NEW.MD}
														</Button>
													)}
												</div>
											</TableCell>
										);
									default:
										return <TableCell>-</TableCell>;
								}
							}}
						</TableRow>
					)}
				</TableBody>
			</Table>
		</div>
	);
}