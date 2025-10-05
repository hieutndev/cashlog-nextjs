"use client";

import { useEffect, useState } from "react";
import { Button } from "@heroui/button";
import Image from "next/image";
import { Skeleton } from "@heroui/skeleton";
import clsx from "clsx";
import { useFetch } from "hieutndev-toolkit";
import { useWindowSize } from "hieutndev-toolkit";

import RecurringDetails from "./recurring-details";
import EditRecurring from "./edit-recurring";

import { getBankLogo } from "@/configs/bank";
import ICONS from "@/configs/icons";
import { IAPIResponse } from "@/types/global";
import { TRecurringResponse } from "@/types/recurring";
import { BREAK_POINT } from "@/configs/break-point";
import { TBankCode } from "@/types/bank";

interface RecurringDetailsContainerProps {
	recurringId: string;
}

export default function RecurringDetailsWrapper({ recurringId }: RecurringDetailsContainerProps) {
	const { width } = useWindowSize();

	const [editMode, setEditMode] = useState<boolean>(false);
	const [recurringDetails, setRecurringDetails] = useState<TRecurringResponse | null>(null);

	const {
		data: fetchRecurringResult,
		fetch: fetchRecurring,
		loading: loadingRecurring,
	} = useFetch<IAPIResponse<TRecurringResponse & { upcoming_instances?: any[] }>>(`/recurrings/${recurringId}`, {
		method: "GET",
		skip: true,
	});

	const onEditSuccess = async () => {
		setEditMode(false);
		await fetchRecurring();
	};

	useEffect(() => {
		if (recurringId) {
			fetchRecurring();
		}
	}, [recurringId, fetchRecurring]);

	useEffect(() => {
		if (fetchRecurringResult && fetchRecurringResult.results) {
			setRecurringDetails(fetchRecurringResult.results || null);
		}
	}, [fetchRecurringResult]);

	return (
		<section
			className={clsx("w-full flex flex-col gap-8", {
				"col-span-10": width >= BREAK_POINT.LG,
				"col-span-12": width < BREAK_POINT.LG,
			})}
		>
			<div className={"w-full flex items-center justify-between"}>
				<div className={"w-max flex items-center gap-4"}>
					<Image
						alt={"bank logo"}
						className={"w-12 h-12"}
						height={1200}
						src={recurringDetails?.bank_code ? getBankLogo(recurringDetails.bank_code as TBankCode, 1) : "/1x1b.png"}
						width={1200}
					/>
					{recurringDetails ? (
						<div className={"flex flex-col h-full justify-between items-start"}>
							<h3 className={"text-2xl font-semibold"}>{recurringDetails?.recurring_name || ""}</h3>
							<h6 className={"text-sm font-medium text-gray-300 italic"}>
								{recurringDetails?.card_name || ""}
							</h6>
						</div>
					) : (
						<div className={"flex flex-col h-full justify-between items-start gap-1"}>
							<Skeleton>
								<h3 className={"text-2xl font-semibold"}>Recurring name</h3>
							</Skeleton>
							<Skeleton>
								<h6 className={"text-sm font-medium text-gray-300 italic"}>Vietcombank</h6>
							</Skeleton>
						</div>
					)}
				</div>
				{editMode ? (
					<Button
						isIconOnly
						color={"danger"}
						startContent={ICONS.XMARK.LG}
						onPress={() => setEditMode(false)}
					/>
				) : (
					<Button
						isIconOnly
						color={"warning"}
						startContent={ICONS.EDIT.MD}
						variant={"ghost"}
						onPress={() => setEditMode(true)}
					/>
				)}
			</div>
			{editMode ? (
				<EditRecurring
					recurringDetails={recurringDetails}
					recurringId={recurringId}
					onEditSuccess={onEditSuccess}
				/>
			) : (
				<RecurringDetails
					loadingRecurring={loadingRecurring}
					recurringDetails={recurringDetails}
				/>
			)}
		</section>
	);
}
