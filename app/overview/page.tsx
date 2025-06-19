"use client";

import { useEffect, useState } from "react";
import { addToast } from "@heroui/toast";
import { ChipProps } from "@heroui/chip";
import { Button } from "@heroui/button";
import moment from "moment";
import { Select, SelectItem } from "@heroui/select";
import { Spinner } from "@heroui/spinner";

import ContentHeader from "@/components/shared/partials/content-header";
import Container from "@/components/shared/container/container";
import AnalyticBlock from "@/components/overview/analytic-block/analytic-block";
import { useFetch } from "@/hooks/useFetch";
import { IAPIResponse } from "@/types/global";
import SYS_ICONS from "@/config/icons";
import { TAnalyticsResponse } from "@/types/analytics";
import Chart from "@/components/overview/chartjs/chart";
import { TCard } from "@/types/card";
import BankCard from "@/components/shared/bank-card/bank-card";
import { useAuth } from "@/components/providers/auth-provider";
import { MAP_ICON } from "@/config/map-icons";

export default function OverviewPage() {
	const { isLoggedIn } = useAuth();
	const [currentCardPage, setCurrentCardPage] = useState(0);
	const [selectedTimePeriod, setSelectedTimePeriod] = useState<string>("month");

	const {
		data: analyticsResult,
		error: analyticsError,
		fetch: fetchAnalytics,
	} = useFetch<IAPIResponse<TAnalyticsResponse>>(`/analytics`, {
		skip: true,
	});

	const {
		data: fetchCardResult,
		loading: loadingCards,
		error: fetchCardError,
		fetch: fetchCards,
	} = useFetch<IAPIResponse<TCard[]>>(`/cards`, {
		skip: true,
	});

	useEffect(() => {
		if (analyticsError) {
			const parseError = JSON.parse(analyticsError);

			addToast({
				title: "Error",
				description: parseError.message,
				color: "danger",
			});
		}
	}, [analyticsResult, analyticsError]);

	useEffect(() => {
		if (fetchCardError) {
			const parseError = JSON.parse(fetchCardError);

			addToast({
				title: "Error",
				description: parseError.message,
				color: "danger",
			});
		}
	}, [fetchCardResult, fetchCardError]);

	useEffect(() => {
		if (isLoggedIn) {
			fetchAnalytics();
			fetchCards();
		}
	}, [isLoggedIn]);

	// Time period options for the filter
	const timePeriodOptions = [
		{ key: "day", label: "Day" },
		{ key: "week", label: "Week" },
		{ key: "month", label: "Month" },
		{ key: "year", label: "Year" },
	];

	// Get balance fluctuation data for the selected time period
	const balanceFluctuationData = analyticsResult?.results?.balanceFluctuation?.[selectedTimePeriod] || [];

	// Pagination logic for cards
	const cardsPerPage = 1;
	const totalCards = fetchCardResult?.results?.length || 0;
	const totalPages = Math.ceil(totalCards / cardsPerPage);
	const startIndex = currentCardPage * cardsPerPage;
	const endIndex = startIndex + cardsPerPage;
	const currentCards = fetchCardResult?.results?.slice(startIndex, endIndex) || [];

	const handlePreviousPage = () => {
		setCurrentCardPage((prev) => Math.max(0, prev - 1));
	};

	const handleNextPage = () => {
		setCurrentCardPage((prev) => Math.min(totalPages - 1, prev + 1));
	};

	// Handle time period filter change
	const handleTimePeriodChange = (value: string) => {
		setSelectedTimePeriod(value);
	};

	return (
		isLoggedIn && (
			<Container
				shadow
				className={"bg-white border border-gray-200 rounded-xl"}
				orientation={"vertical"}
			>
				<ContentHeader title={"Overview"} />
				<div className={"w-full grid grid-cols-12 gap-4"}>
					<div className="col-span-8 flex flex-col gap-4">
						<div className="flex flex-col gap-4 bg-white border p-4 rounded-3xl shadow-sm">
							<header className="flex justify-between items-center">
								<h3 className="text-lg font-semibold">Financial Analytics</h3>

								<div className={""}>
									<Select
										classNames={{
											mainWrapper: "min-w-28",
										}}
										items={timePeriodOptions}
										label={"Time Period:"}
										labelPlacement={"outside-left"}
										selectedKeys={[selectedTimePeriod]}
										size="md"
										variant="bordered"
										onChange={(e) => handleTimePeriodChange(e.target.value)}
									>
										{(option) => <SelectItem key={option.key}>{option.label}</SelectItem>}
									</Select>
								</div>
							</header>

							<main className="grid grid-cols-3 gap-4">
								{balanceFluctuationData.length > 0 ? (
									balanceFluctuationData.map((item, index) => (
										<AnalyticBlock
											key={`${selectedTimePeriod}-${index}`}
											color={item.color as ChipProps["color"]}
											label={item.label}
											labelIcon={MAP_ICON[item.labelIcon]}
											timeRange={selectedTimePeriod}
											value={{
												...item.value,
												icon: MAP_ICON[item.value.icon],
											}}
										/>
									))
								) : (
									<div className={"col-span-3 w-full min-h-56 flex justify-center items-center"}>
										<Spinner>Retrieving data...</Spinner>
									</div>
								)}
							</main>
						</div>
					</div>
					<div className="col-span-4 h-full flex flex-col gap-4 bg-white border border-gray-200 p-4 rounded-3xl shadow-sm">
						<header className="flex justify-between items-center">
							<h6 className="text-lg font-semibold">Bank Cards</h6>
							<div className="flex items-center gap-2">
								<Button
									isIconOnly
									isDisabled={currentCardPage === 0}
									size="sm"
									variant="light"
									onPress={handlePreviousPage}
								>
									{SYS_ICONS.BACK.MD}
								</Button>
								<span className="text-sm text-gray-500">
									{totalPages > 0 ? `${currentCardPage + 1}/${totalPages}` : "0/0"}
								</span>
								<Button
									isIconOnly
									isDisabled={currentCardPage >= totalPages - 1}
									size="sm"
									variant="light"
									onPress={handleNextPage}
								>
									{SYS_ICONS.NEXT.MD}
								</Button>
							</div>
						</header>
						<main>
							{loadingCards ? (
								<div className={"min-h-56 flex justify-center items-center"}>
									<Spinner>Retrieving card...</Spinner>
								</div>
							) : currentCards.length > 0 ? (
								currentCards.map((card) => (
									<BankCard
										key={card.card_id}
										bankCode={card.bank_code}
										cardBalance={card.card_balance}
										cardName={card.card_name}
										className={"w-full"}
										color={card.card_color}
									/>
								))
							) : (
								<div className="text-center py-8 text-gray-500">No cards available</div>
							)}
						</main>
					</div>
				</div>
				<div className={"flex flex-col gap-4 bg-white shadow-sm rounded-3xl p-4 border"}>
					<header>
						<h6 className="text-xl font-semibold">Cashflow Chart</h6>
					</header>
					<main>
						<Chart
							columnLabels={analyticsResult?.results?.charts?.[moment().format("M")]?.columnLabels ?? []}
							dataSets={analyticsResult?.results?.charts?.[moment().format("M")]?.dataSets ?? []}
						/>
					</main>
				</div>
			</Container>
		)
	);
}
