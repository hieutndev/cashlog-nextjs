"use client";

import { useEffect, useState } from "react";
import { Button } from "@heroui/button";
import Image from "next/image";
import { Skeleton } from "@heroui/skeleton";
import clsx from "clsx";

import { getBankLogo } from "@/configs/bank";
import SYS_ICONS from "@/configs/icons";
import { useFetch } from "@/hooks/useFetch";
import { IAPIResponse } from "@/types/global";
import { TFetchForecastDetailsResult, TForecastWithDetailAndCard } from "@/types/forecast";
import ForecastDetails from "@/app/settings/forecasts/[forecastId]/_pages/forecast-details";
import EditForecast from "@/app/settings/forecasts/[forecastId]/_pages/edit-forecast";
import { BREAK_POINT } from "@/configs/break-point";
import useScreenSize from "@/hooks/useScreenSize";

interface ForecastDetailsContainerProps {
	forecastId: string;
}

export default function ForecastDetailsWrapper({ forecastId }: ForecastDetailsContainerProps) {
	const { width } = useScreenSize();

	const [editMode, setEditMode] = useState<boolean>(false);
	const [forecastDetails, setForecastDetails] = useState<TForecastWithDetailAndCard | null>(null);
	const [transactions, setTransactions] = useState<TForecastWithDetailAndCard[]>([]);

	const {
		data: fetchForecastResult,
		fetch: fetchForecast,
		loading: loadingForecast,
	} = useFetch<IAPIResponse<TFetchForecastDetailsResult>>(`/forecasts/${forecastId}`, {
		method: "GET",
		skip: true,
	});

	const onEditSuccess = async () => {
		setEditMode(false);
		await fetchForecast();
	};

	useEffect(() => {
		if (forecastId) {
			fetchForecast();
		}
	}, [forecastId]);

	useEffect(() => {
		if (fetchForecastResult && fetchForecastResult.results) {
			// Use the first transaction for summary, and all transactions for the table
			setForecastDetails(fetchForecastResult.results.details || null);
			setTransactions(fetchForecastResult.results.transactions || []);
		}
	}, [fetchForecastResult]);

	return (
		<section
			className={clsx("w-full flex flex-col gap-8", {
				"col-span-10": width >= BREAK_POINT.L,
				"col-span-12": width < BREAK_POINT.L,
			})}
		>
			<div className={"w-full flex items-center justify-between"}>
				<div className={"w-max flex items-center gap-4"}>
					<Image
						alt={"bank logo"}
						className={"w-12 h-12"}
						height={1200}
						src={forecastDetails?.bank_code ? getBankLogo(forecastDetails?.bank_code, 1) : "/1x1b.png"}
						width={1200}
					/>
					{forecastDetails ? (
						<div className={"flex flex-col h-full justify-between items-start"}>
							<h3 className={"text-2xl font-semibold"}>{forecastDetails?.forecast_name || ""}</h3>
							<h6 className={"text-sm font-medium text-gray-300 italic"}>
								{forecastDetails?.card_name || ""}
							</h6>
						</div>
					) : (
						<div className={"flex flex-col h-full justify-between items-start gap-1"}>
							<Skeleton>
								<h3 className={"text-2xl font-semibold"}>Forecast name</h3>
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
						size={"lg"}
						startContent={SYS_ICONS.XMARK.LG}
						onPress={() => setEditMode(false)}
					/>
				) : (
					<Button
						isIconOnly
						color={"warning"}
						size={"lg"}
						startContent={SYS_ICONS.EDIT.MD}
						variant={"ghost"}
						onPress={() => setEditMode(true)}
					/>
				)}
			</div>
			{editMode ? (
				<EditForecast
					forecastDetails={forecastDetails}
					forecastId={forecastId}
					onEditSuccess={onEditSuccess}
				/>
			) : (
				<ForecastDetails
					forecastDetails={forecastDetails}
					loadingForecast={loadingForecast}
					transactions={transactions}
				/>
			)}
		</section>
	);
}
