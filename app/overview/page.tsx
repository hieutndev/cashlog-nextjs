"use client";

import { useEffect, useState } from "react";
import { addToast } from "@heroui/toast";
import { ChipProps } from "@heroui/chip";
import { Select, SelectItem } from "@heroui/select";
import { Spinner } from "@heroui/spinner";
import { Image } from "@heroui/image";
import clsx from "clsx";
import moment from "moment";
import { useFetch } from "hieutndev-toolkit";
import { useWindowSize } from "hieutndev-toolkit";

import ContentHeader from "@/components/shared/partials/content-header";
import Container from "@/components/shared/container/container";
import AnalyticBlock from "@/components/overview/analytic-block/analytic-block";
import { IAPIResponse } from "@/types/global";
import { TAnalyticsResponse, TMonthlyAnalyticsResponse } from "@/types/analytics";
import PieChart from "@/components/overview/chartjs/pie-chart";
import FinancialLineChart from "@/components/overview/chartjs/multi-line-chart";
import { TCard } from "@/types/card";
import { MAP_ICON } from "@/configs/map-icons";
import { BREAK_POINT } from "@/configs/break-point";
import { cutString } from "@/utils/text-transform";
import { getBankLogo } from "@/configs/bank";
import { SITE_CONFIG } from "@/configs/site-config";

const EST_YEAR = process.env.NEXT_PUBLIC_EST_YEAR ? parseInt(process.env.NEXT_PUBLIC_EST_YEAR) : 2025;

export default function OverviewPage() {

	const { width } = useWindowSize();

	const [selectedTimePeriod, setSelectedTimePeriod] = useState<string>("month");
	const [selectedSpecificTime, setSelectedSpecificTime] = useState<string>(() => {
		// Set default to current month since default time period is "month"
		return (moment().month() + 1).toString();
	});

	const isSpecificTimeEnabled = selectedTimePeriod === 'month' || selectedTimePeriod === 'year';

	// Build analytics URL with parameters
	const buildAnalyticsUrl = () => {
		const params = new URLSearchParams();

		params.set('time_period', selectedTimePeriod);

		if (selectedSpecificTime && isSpecificTimeEnabled) {
			params.set('specific_time', selectedSpecificTime);
		}

		return `/analytics?${params.toString()}`;
	};

	const {
		data: analyticsData,
		loading: analyticsLoading,
		error: analyticsError,
		fetch: fetchAnalyticsData
	} = useFetch<IAPIResponse<TAnalyticsResponse>>(buildAnalyticsUrl());



	const {
		data: fetchCardResult,
		loading: loadingCards,
		error: fetchCardError,
		fetch: fetchCards,
	} = useFetch<IAPIResponse<TCard[]>>(`/cards`, {
		skip: true,
	});

	const {
		data: categoryStatsResult,
		error: categoryStatsError,
		fetch: fetchCategoryStats,
	} = useFetch<IAPIResponse<{ category: string; color: string; total: number }[]>>(`/analytics/category-breakdown`, {
		skip: true,
	});

	const {
		data: monthlyAnalyticsResult,
		loading: loadingMonthlyAnalytics,
		error: monthlyAnalyticsError,
		fetch: fetchMonthlyAnalytics,
	} = useFetch<IAPIResponse<TMonthlyAnalyticsResponse>>(`/analytics/fluctuations`, {
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
	}, [analyticsData, analyticsError]);

	const [totalBalance, setTotalBalance] = useState(0);

	useEffect(() => {

		if (fetchCardResult) {
			if (fetchCardResult.results && fetchCardResult.results.length > 0) {
				setTotalBalance(fetchCardResult.results.reduce((acc, card) => acc + (card.card_balance || 0), 0));
			}
		}

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
		if (categoryStatsError) {
			const parseError = JSON.parse(categoryStatsError);

			addToast({
				title: "Error",
				description: parseError.message,
				color: "danger",
			});
		}
	}, [categoryStatsResult, categoryStatsError]);

	useEffect(() => {
		if (monthlyAnalyticsError) {
			const parseError = JSON.parse(monthlyAnalyticsError);

			addToast({
				title: "Error",
				description: parseError.message,
				color: "danger",
			});
		}
	}, [monthlyAnalyticsResult, monthlyAnalyticsError]);

	useEffect(() => {
		fetchCards();
		fetchCategoryStats();
		fetchMonthlyAnalytics();
	}, []);

	// Fetch analytics when time period or specific time changes
	useEffect(() => {

		fetchAnalyticsData();

	}, [selectedTimePeriod, selectedSpecificTime]);

	const timePeriodOptions = [
		{ key: "day", label: "Day" },
		{ key: "week", label: "Week" },
		{ key: "month", label: "Month" },
		{ key: "year", label: "Year" },
	];

	const monthOptions = Array.from({ length: 12 }, (_, i) => ({
		key: (i + 1).toString(),
		label: moment().month(i).format('MMM'),
	}));

	const yearOptions = Array.from({ length: (new Date()).getFullYear() + 1 - EST_YEAR }, (_, i) => ({
		key: (EST_YEAR + i).toString(),
		label: (EST_YEAR + i).toString(),
	}));

	// Get specific time options based on selected time period
	const getSpecificTimeOptions = () => {
		if (selectedTimePeriod === 'month') return monthOptions;
		if (selectedTimePeriod === 'year') return yearOptions;

		return [];
	};



	const balanceFluctuationData = analyticsData?.results?.balanceFluctuation?.[selectedTimePeriod] || [];

	const handleTimePeriodChange = (value: string) => {
		setSelectedTimePeriod(value);
		if (value === 'month') {
			setSelectedSpecificTime((moment().month() + 1).toString());
		} else if (value === 'year') {
			setSelectedSpecificTime(moment().year().toString());
		} else {
			setSelectedSpecificTime("");
		}
	};

	const handleSpecificTimeChange = (value: string) => {
		setSelectedSpecificTime(value);
	};

	return (
		<Container
			shadow
			className={clsx("bg-white border-2 border-gray-200 rounded-3xl lg:px-8 px-4")}
			orientation={"vertical"}
		>
			<ContentHeader classNames={{
				title: "w-full sm:text-left text-center"
			}} title={"Overview"} />
			<div className={"w-full h-full grid grid-cols-12 gap-4"}>
				<div
					className={clsx("h-full flex flex-col gap-4 lg:col-span-8 col-span-12 lg:order-1 order-2")}
				>
					<div className="h-full flex flex-col gap-4 bg-white border-2 p-4 rounded-3xl shadow-sm">
						<header
							className={clsx("flex justify-between items-center gap-4 lg:flex-row flex-col")}
						>
							<h3 className="text-lg font-semibold">Financial Analytics</h3>

							<div className="flex md:flex-row flex-col items-center gap-4">
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

								<Select
									classNames={{
										mainWrapper: "min-w-28",
									}}
									isDisabled={!isSpecificTimeEnabled}
									items={getSpecificTimeOptions()}
									label={"Specific Time:"}
									labelPlacement={"outside-left"}
									placeholder={isSpecificTimeEnabled ? "Select..." : "Not available"}
									selectedKeys={selectedSpecificTime ? [selectedSpecificTime] : []}
									size="md"
									variant="bordered"
									onChange={(e) => handleSpecificTimeChange(e.target.value)}
								>
									{(option) => <SelectItem key={option.key}>{option.label}</SelectItem>}
								</Select>
							</div>
						</header>

						<main
							className={clsx("grid gap-4", {
								"grid-cols-3": width > BREAK_POINT.XL,
								"grid-cols-2": width < BREAK_POINT.XL && width > BREAK_POINT.LG,
								"grid-cols-1": width <= BREAK_POINT.LG,
							})}
						>
							{analyticsLoading ? (
								<div className={"col-span-3 w-full min-h-56 flex justify-center items-center"}>
									<Spinner>Retrieving data...</Spinner>
								</div>
							) : balanceFluctuationData.length > 0 ? (
								balanceFluctuationData.map((item: any, index: number) => (
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
									<p className="text-gray-500">No analytics data available</p>
								</div>
							)}
						</main>

						{/* Financial Trends Line Chart */}
						<div className="w-full hidden md:block min-h-[300px]">
							<FinancialLineChart
								data={monthlyAnalyticsResult?.results || null}
								error={monthlyAnalyticsError ? JSON.parse(monthlyAnalyticsError).message : null}
								loading={loadingMonthlyAnalytics}
							/>
						</div>
					</div>
				</div>
				<div
					className={clsx(
						"h-max flex flex-col gap-4 bg-white border-2 border-gray-200 p-4 rounded-3xl shadow-sm lg:col-span-4 col-span-12 lg:order-2 order-1"
					)}
				>
					<header className="w-full flex justify-between items-center">
						<h6 className="w-full lg:text-left text-center text-lg font-semibold">Total Balance</h6>
					</header>
					<main className={"flex flex-col gap-8"}>
						{/* Total balance content goes here */}
						<h1 className={'w-full text-center text-5xl font-bold text-primary'}>{totalBalance.toLocaleString()}{SITE_CONFIG.CURRENCY_STRING}</h1>
						<div className={"w-full flex flex-col gap-4"}>
							{loadingCards &&
								<div className={"w-full flex justify-center h-44"}>
									<Spinner>Loading cards...</Spinner>
								</div>
							}
							{fetchCardResult?.results &&
								fetchCardResult.results.map(card => (
									<div key={card.card_id} className={"flex w-full justify-start gap-2 items-center"}>
										<Image
											isBlurred
											alt={card.card_name}
											className={"w-10 p-1"}
											radius={"none"}
											src={getBankLogo(card.bank_code, 1)}
										/>
										<div className={"w-full flex justify-between items-center gap-2"}>
											<p className={"text-base min-w-max"}>{cutString(card.card_name, 12)}</p>
											<p className={"font-semibold text-base"}>{card.card_balance.toLocaleString()}{SITE_CONFIG.CURRENCY_STRING}</p>
										</div>
									</div>
								))}
						</div>
					</main>
				</div>
			</div>
			<div className={"flex flex-col gap-4 bg-white shadow-sm rounded-3xl p-4 border-2"}>
				<header>
					<h6 className="text-lg font-semibold text-center">Category Breakdown</h6>
				</header>
				<main>
					<PieChart data={categoryStatsResult?.results ?? []} />
				</main>
			</div>
		</Container>
	);
}
