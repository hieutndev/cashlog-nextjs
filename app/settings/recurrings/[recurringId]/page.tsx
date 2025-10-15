"use client";

import { useEffect, useState } from "react";
import { Image } from "@heroui/image"
import clsx from "clsx";
import { useFetch } from "hieutndev-toolkit";
import { useWindowSize } from "hieutndev-toolkit";
import { useRouter } from "next/navigation";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import moment from "moment";
import { Button } from "@heroui/button";
import { useDisclosure } from "@heroui/modal";
import { addToast } from "@heroui/toast";

import RecurringInstancesTable from "../../../../components/recurrings/recurring-instances-table";

import { getBankLogo } from "@/configs/bank";
import ICONS from "@/configs/icons";
import { IAPIResponse } from "@/types/global";
import { TCompleteInstanceFormData, TRecurringInstance, TRecurringResponse } from "@/types/recurring";
import { BREAK_POINT } from "@/configs/break-point";
import { TBankCode } from "@/types/bank";
import { SITE_CONFIG } from "@/configs/site-config";
import LoadingBlock from "@/components/shared/loading-block/loading-block";
import CustomModal from "@/components/shared/custom-modal/custom-modal";
import RecurringInstanceForm from "@/components/recurrings/recurring-instance-form";
import { API_ENDPOINT } from "@/configs/api-endpoint";

interface RecurringDetailsPageProps {
	params: Promise<{ recurringId: string }>;
}

export default function RecurringDetailsPage({ params }: RecurringDetailsPageProps) {

	const router = useRouter();

	const { width } = useWindowSize();

	const [recurringId, setRecurringId] = useState<string>("");
	const [recurringDetails, setRecurringDetails] = useState<TRecurringResponse | null>(null);
	const [statisticsData, setStatisticsData] = useState<any[]>([]);

	useEffect(() => {
		params.then((p) => setRecurringId(p.recurringId));
	}, [params]);

	const {
		data: fetchRecurringResult,
		fetch: fetchRecurring
	} = useFetch<IAPIResponse<TRecurringResponse>>(`/recurrings/${recurringId}`, {
		method: "GET",
		skip: !recurringId,
	});

	useEffect(() => {
		if (fetchRecurringResult && fetchRecurringResult.results) {
			setRecurringDetails(fetchRecurringResult.results);
			setStatisticsData([
				{
					title: "Total Instances",
					value: `${fetchRecurringResult.results.total_instances || 0}`,
					colSpan: 1,
					color: "primary"
				},
				{
					title: "Total Completed",
					value: `${fetchRecurringResult.results.completed_instances || 0}`,
					colSpan: 1,
					color: "success"
				},
				{
					title: "Total Skipped",
					value: `${fetchRecurringResult.results.skipped_instances || 0}`,
					colSpan: 1,
					color: "secondary"
				},
				{
					title: "Total Overdue",
					value: `${fetchRecurringResult.results.overdue_instances || 0}`,
					colSpan: 1,
					color: "danger"
				}
			]);
		}
	}, [fetchRecurringResult]);

	/* HANDLE SELECTED INSTANCE */
	const [selectedInstance, setSelectedInstance] = useState<TRecurringInstance | null>(null);
	const [action, setAction] = useState<'skip' | 'create' | null>(null);

	const handleSelectedInstance = (instance: TRecurringInstance, action: 'skip' | 'create') => {
		setSelectedInstance(instance);
		setAction(action);
	};

	const resetSelectedInstance = () => {
		setSelectedInstance(null);
		setAction(null);
	}

	const { isOpen, onOpenChange } = useDisclosure();

	useEffect(() => {
		if (selectedInstance !== null && action !== null) {
			switch (action) {
				case 'create':
					onOpenChange();
					break;

				case 'skip':
					// call skip API
					skipInstance({
						body: {
							reason: 'Skipped by user'
						}
					});
					resetSelectedInstance();
					break;

				default:
					break;
			}
		}
	}, [selectedInstance, action]);

	useEffect(() => {
		if (isOpen === false) {
			resetSelectedInstance();
		}
	}, [isOpen]);

	/* HANDLE CREATE TRANSACTION */

	const { data: createTransactionResult, error: createTransactionError, loading: creatingTransaction, fetch: createTransaction } = useFetch<IAPIResponse>(API_ENDPOINT.RECURRINGS.INSTANCE_CREATE_TRANSACTION(selectedInstance?.instance_id?.toString() ?? '-1'), {
		method: 'POST',
		skip: true,
	})

	useEffect(() => {
		if (createTransactionResult) {
			addToast({
				title: "Success",
				description: createTransactionResult.message,
				color: "success",
			});
			fetchRecurring();
			onOpenChange();
		}

		if (createTransactionError) {
			const parsedError = JSON.parse(createTransactionError);

			addToast({
				title: "Error",
				description: parsedError.message,
				color: "danger",
			});
		}
	}, [createTransactionResult, createTransactionError]);

	/* HANDLE SKIP INSTANCE */

	const {
		data: skipInstanceResult,
		error: skipInstanceError,
		loading: skippingInstance,
		fetch: skipInstance
	} = useFetch<IAPIResponse>(API_ENDPOINT.RECURRINGS.INSTANCE_SKIP(selectedInstance?.instance_id?.toString() ?? '-1'), {
		method: 'POST',
		skip: true,
	})

	useEffect(() => {
		if (skipInstanceResult) {
			addToast({
				title: "Success",
				description: skipInstanceResult.message,
				color: "success",
			});
			fetchRecurring();
		}

		if (skipInstanceError) {
			const parsedError = JSON.parse(skipInstanceError);

			addToast({
				title: "Error",
				description: parsedError.message,
				color: "danger",
			});
		}
	}, [skipInstanceResult, skipInstanceError]);

	const handleAddTransactionFromInstance = (instanceId: TRecurringInstance['instance_id'], payload: TCompleteInstanceFormData) => {
		createTransaction({
			url: API_ENDPOINT.RECURRINGS.INSTANCE_CREATE_TRANSACTION(instanceId.toString()),
			method: 'POST',
			body: {
				amount: payload.actual_amount,
				transaction_date: payload.actual_date,
				category_id: payload.category_id,
				note: payload.notes,
			},
		});
	}

	const formatFrequency = (frequency: string, interval: number) => {
		if (interval === 1) {
			return frequency.charAt(0).toUpperCase() + frequency.slice(1);
		}

		return `Every ${interval} ${frequency}`;
	};

	return (
		<section
			className={clsx("w-full flex flex-col gap-8", {
				"col-span-10": width >= BREAK_POINT.LG,
				"col-span-12": width < BREAK_POINT.LG,
			})}
		>
			<div className={"w-full flex items-start justify-between"}>
				<div className={"flex flex-col justify-start items-start gap-2"}>
					<div className={"flex flex-row h-full justify-center items-center gap-4"}>
						<Image
							alt={"bank logo"}
							className={"max-w-12 max-h-12 p-2 border border-gray-200"}
							height={1200}
							src={recurringDetails?.bank_code ? getBankLogo(recurringDetails.bank_code as TBankCode, 1) : "/1x1b.png"}
							width={1200}
						/>
						<h3 className={"text-xl font-semibold"}>{recurringDetails?.recurring_name || ""}</h3>
						{recurringDetails &&
							<div className={"flex flex-row items-center gap-2"}>
								<Chip color={recurringDetails.direction === "in" ? "success" : "danger"} size={"sm"} variant={"flat"}>
									{recurringDetails.direction === "in" ? "+" : "-"}{recurringDetails.amount.toLocaleString()}{SITE_CONFIG.CURRENCY_STRING}
								</Chip>
								<Chip color={"secondary"} size={"sm"} variant={"flat"}>
									{recurringDetails.interval === 1
										? recurringDetails.frequency.charAt(0).toUpperCase() + recurringDetails.frequency.slice(1)
										: formatFrequency(recurringDetails.frequency, recurringDetails.interval)}
								</Chip>
								<Chip color={"warning"} size={"sm"} variant={"flat"}>
									{moment(recurringDetails.start_date).format("DD MMM, YYYY")} - {recurringDetails.end_date ? moment(recurringDetails.end_date).format("DD MMM, YYYY") : "N/A"}
								</Chip>
							</div>
						}
					</div>

				</div>
				<div className={"flex flex-row gap-4"}>
					<Button
						color={"primary"}
						startContent={ICONS.BACK.SM}
						variant={"light"}
						onPress={() => router.push("/settings/recurrings")}
					>
						<span>Back</span>
					</Button>
					<Button
						isIconOnly
						color={"warning"}
						startContent={ICONS.EDIT.SM}
						variant={"flat"}
						onPress={() => router.push(`/settings/recurrings/${recurringId}/update`)}
					/>
				</div>
			</div>
			{!recurringDetails ? (
				<LoadingBlock />
			) : (
				<section className={"w-full flex flex-col gap-4"}>
					<div className={"grid grid-cols-4 gap-4"}>
						{statisticsData && statisticsData.map((s) =>

							<Card key={s.title} className={clsx(`bg-${s.color}-50 rounded-lg`, s.colSpan ? `col-span-${s.colSpan}` : "col-span-1")}>
								<CardHeader className={`justify-center text-sm text-${s.color}-400 font-medium`}>{s.title}</CardHeader>
								<CardBody className={`w-full text-center pt-0 text-2xl font-semibold text-${s.color}-600`}>
									{s.value}
								</CardBody>
							</Card>

						)
						}
					</div>

					<div className={"flex flex-col gap-4"}>
						<RecurringInstancesTable
							instances={recurringDetails.upcoming_instances}
							isCreating={creatingTransaction}
							isSkipping={skippingInstance}
							onCreate={(instance) => handleSelectedInstance(instance, 'create')}
							onSkip={(instance) => handleSelectedInstance(instance, 'skip')}
						/>
					</div>

				</section>
			)
			}
			<CustomModal
				isOpen={isOpen}
				title="Create Transaction From Instance"
				onOpenChange={onOpenChange}
			>
				<RecurringInstanceForm
					instanceId={selectedInstance?.instance_id ?? -1}
					isLoading={creatingTransaction}
					onSubmit={handleAddTransactionFromInstance}
				/>
			</CustomModal>
		</section >
	);
}


