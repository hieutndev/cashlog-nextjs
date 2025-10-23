"use client";

import moment from "moment";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { addToast } from "@heroui/toast";
import { Select, SelectItem } from "@heroui/select";
import { Button } from "@heroui/button";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/table";
import { Chip } from "@heroui/chip";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCards } from "swiper/modules";

import "swiper/css";
import "swiper/css/effect-cards";

import { Card, CardBody } from "@heroui/card";
import { useDisclosure } from "@heroui/modal";


import { useDashboardEndpoint } from "@/hooks/useDashboardEndpoint";
import Container from "@/components/shared/container/container";
import BankCard from "@/components/shared/bank-card/bank-card";
import CategoryBreakdownChart from "@/components/dashboard/chartjs/category-breakdown-chart";
import FinancialAnalysisChart from "@/components/dashboard/chartjs/financial-analysis-chart";
import CategoryDetailsModal from "@/components/dashboard/category-details-modal";
import { MAP_ICON } from "@/configs/map-icons";
import { SITE_CONFIG } from "@/configs/site-config";
import LoadingBlock from "@/components/shared/loading-block/loading-block";
import AnalyticBlock from "@/components/dashboard/analytic-block/analytic-block";
import { TDashboardData } from "@/types/dashboard";
import ICONS from "@/configs/icons";

const EST_YEAR = process.env.NEXT_PUBLIC_EST_YEAR ? parseInt(process.env.NEXT_PUBLIC_EST_YEAR) : 2025;

export default function DashboardPage() {
	const [selectedTimePeriod, setSelectedTimePeriod] = useState<string>("month");
	const [selectedSpecificTime, setSelectedSpecificTime] = useState<string>(() => {
		return (moment().month() + 1).toString();
	});

	const [dashboardData, setDashboardData] = useState<TDashboardData | null>(null);
	const [totalAssetData, setTotalAssetData] = useState<any>(null);
	const [categoryVolumeData, setCategoryVolumeData] = useState<any>(null);

	// Modal state for category details
	const { isOpen: isOpenCategoryDetailsModal, onOpen: onOpenCategoryDetailsModal, onOpenChange: onCategoryDetailsModalChange } = useDisclosure();

	const isSpecificTimeEnabled = selectedTimePeriod === "month" || selectedTimePeriod === "year";

	const { useGetDashboardData, useGetTotalAssetFluctuation, useGetCategoryVolume } = useDashboardEndpoint();

	// Single consolidated API call for all dashboard data
	const {
		data,
		error,
		fetch,
	} = useGetDashboardData({
		time_period: selectedTimePeriod,
		specific_time: selectedSpecificTime && isSpecificTimeEnabled ? selectedSpecificTime : undefined,
	});

	// Fetch total asset fluctuation data
	const {
		data: totalAssetResponse,
		fetch: fetchTotalAsset,
	} = useGetTotalAssetFluctuation({
		time_period: selectedTimePeriod,
		specific_time: selectedSpecificTime && isSpecificTimeEnabled ? selectedSpecificTime : undefined,
	});

	// Fetch category volume data
	const {
		data: categoryVolumeResponse,
		fetch: fetchCategoryVolume,
	} = useGetCategoryVolume({
		time_period: selectedTimePeriod,
		specific_time: selectedSpecificTime && isSpecificTimeEnabled ? selectedSpecificTime : undefined,
	});

	// Consolidated error handling
	useEffect(() => {
		if (error) {
			const parseError = JSON.parse(error);

			addToast({
				title: "Error",
				description: parseError.message,
				color: "danger",
			});
		}

		if (data && data.results) {
			console.log("data.results: ", data.results);

			setDashboardData(data.results);
		}

	}, [error, data]);

	// Handle total asset data
	useEffect(() => {
		if (totalAssetResponse && totalAssetResponse.results) {
			setTotalAssetData(totalAssetResponse.results);
		}
	}, [totalAssetResponse]);

	// Handle category volume data
	useEffect(() => {
		if (categoryVolumeResponse && categoryVolumeResponse.results) {
			setCategoryVolumeData(categoryVolumeResponse.results);
		}
	}, [categoryVolumeResponse]);

	// Fetch dashboard data when time period changes
	useEffect(() => {
		fetch();
		fetchTotalAsset();
		fetchCategoryVolume();
	}, [selectedTimePeriod, selectedSpecificTime]);

	const timePeriodOptions = [
		{ key: "day", label: "Day" },
		{ key: "week", label: "Week" },
		{ key: "month", label: "Month" },
		{ key: "year", label: "Year" },
	];

	const monthOptions = Array.from({ length: 12 }, (_, i) => ({
		key: (i + 1).toString(),
		label: moment().month(i).format("MMM"),
	}));

	const yearOptions = Array.from(
		{ length: new Date().getFullYear() + 1 - EST_YEAR },
		(_, i) => ({
			key: (EST_YEAR + i).toString(),
			label: (EST_YEAR + i).toString(),
		})
	);

	const getSpecificTimeOptions = () => {
		if (selectedTimePeriod === "month") return monthOptions;
		if (selectedTimePeriod === "year") return yearOptions;

		return [];
	};

	// Extract data from consolidated response
	const analytics = dashboardData?.analytics;
	const cards = dashboardData?.cards || [];
	const categoryBreakdown = dashboardData?.category_breakdown || [];
	const monthlyAnalytics = dashboardData?.monthly_analytics || null;
	const recentTransactions = dashboardData?.recent_transactions || [];
	const upcomingRecurrings = dashboardData?.upcoming_recurrings;

	const balanceFluctuationData =
		analytics?.balanceFluctuation?.[selectedTimePeriod] || [];

	const handleTimePeriodChange = (value: string) => {
		setSelectedTimePeriod(value);
		if (value === "month") {
			setSelectedSpecificTime((moment().month() + 1).toString());
		} else if (value === "year") {
			setSelectedSpecificTime(moment().year().toString());
		} else {
			setSelectedSpecificTime("");
		}
	};

	const handleSpecificTimeChange = (value: string) => {
		setSelectedSpecificTime(value);
	};

	// Get the time range label for the analytic blocks
	const getTimeRangeLabel = () => {
		if (selectedTimePeriod === "day") return "day";
		if (selectedTimePeriod === "week") return "week";
		if (selectedTimePeriod === "month") return "month";
		if (selectedTimePeriod === "year") return "year";

		return "period";
	};

	return (
		<Container className={"!p-0"}
			orientation={"vertical"}
		>
			<div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-4">
				<div className="lg:col-span-4 flex flex-col gap-4 lg:order-1 order-2">
					<div className="bg-white rounded-3xl">
						{dashboardData === null ? (

							<LoadingBlock className="min-h-72" type="card" />
						) : cards && cards.length > 0 ? (
							<div className="h-72 scale-90">
								<Swiper
									className="w-full h-full"
									effect="cards"
									grabCursor={true}
									loop={true}
									modules={[EffectCards]}
								>
									{cards.map((card) => (
										<SwiperSlide key={card.card_id} className="h-full overflow-hidden bg-transparent rounded-2xl">
											<div className="h-full flex w-full">
												<BankCard
													bankCode={card.bank_code}
													cardBalance={card.card_balance}
													cardName={card.card_name}
													className="h-full"
													color={card.card_color}
												/>
											</div>
										</SwiperSlide>
									))}
								</Swiper>
							</div>
						) : (
							<div className="w-full h-72 flex items-center justify-center text-gray-500">
								<p>No cards available</p>
							</div>
						)}
					</div>

					<Card>
						<CardBody className={"flex flex-col gap-4 items-center"}>
							<div className={"w-full flex items-center justify-between"}>
								<h3 className="text-xl font-semibold text-center text-gray-400/50">Category Breakdown</h3>
								<Button color="primary" endContent={ICONS.NEXT.MD} variant="light" onPress={onOpenCategoryDetailsModal}>
									Details
								</Button>
							</div>
							<CategoryBreakdownChart
								data={categoryBreakdown}
								loading={dashboardData === null}
								volumeData={categoryVolumeData}
								onClick={onOpenCategoryDetailsModal}
							/>
						</CardBody>
					</Card>
				</div>
				<div className="lg:col-span-8 flex flex-col gap-4 lg:order-2 order-1">
					<Card>
						<CardBody className={"flex flex-col gap-4"}>
							<div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
								<h3 className="text-xl font-semibold text-center text-gray-400/50">Financial Analysis</h3>
								<div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
									<Select
										classNames={{
											base: "w-full sm:w-40",
										}}
										items={timePeriodOptions}
										labelPlacement="inside"
										selectedKeys={[selectedTimePeriod]}
										variant="bordered"
										onChange={(e) => handleTimePeriodChange(e.target.value)}
									>
										{(option) => <SelectItem key={option.key}>{option.label}</SelectItem>}
									</Select>

									<Select
										classNames={{
											base: "w-full sm:w-40",
										}}
										isDisabled={!isSpecificTimeEnabled}
										items={isSpecificTimeEnabled ? getSpecificTimeOptions() : []}
										labelPlacement="inside"
										placeholder={isSpecificTimeEnabled ? 'Select specific time' : 'Not available'}
										selectedKeys={[selectedSpecificTime]}
										variant="bordered"
										onChange={(e) => handleSpecificTimeChange(e.target.value)}
									>
										{isSpecificTimeEnabled ?
											(option) => <SelectItem key={option.key}>{option.label}</SelectItem>
											: <SelectItem key='null'>Not available</SelectItem>
										}
									</Select>

								</div>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								{dashboardData === null ?
									Array.from({ length: 3 }).map((_, index) => (
										<LoadingBlock key={index} className={"min-h-32"} type={"card"} />
									))
									: balanceFluctuationData.length > 0 ? (
										balanceFluctuationData.map((item: any, index: number) => (
											<AnalyticBlock
												key={`${selectedTimePeriod}-${index}`}
												color={item.color as any}
												label={item.label}
												labelIcon={MAP_ICON[item.labelIcon]}
												timeRange={getTimeRangeLabel()}
												value={{
													amount: item.value.amount,
													percentage: item.value.percentage,
													subAmount: item.value.subAmount,
													last: item.value.last,
													cashFlow: item.value.cashFlow,
													cashFlowWarning: item.value.cashFlowWarning,
													icon: MAP_ICON[item.value.icon]
												}}
											/>
										))
									) : (
										<div className="col-span-3 w-full min-h-32 flex justify-center items-center">
											<p className="text-gray-500">No analytics data available</p>
										</div>
									)}
							</div>
						</CardBody>
					</Card>


					<Card>
						<CardBody className="flex flex-col items-center justify-center max-h-88 overflow-hidden">
							{dashboardData === null
								? <LoadingBlock />
								: <>
									<h3 className={"w-full font-semibold text-xl text-left text-gray-400/50"}>Fluctuation Chart</h3>
									<FinancialAnalysisChart
										data={monthlyAnalytics}
										error={
											error
												? JSON.parse(error).message
												: null
										}
										totalAssetData={totalAssetData}
									/>
								</>
							}
						</CardBody>
					</Card>

					{/* Recent Transaction Section */}
					<Card>
						<CardBody className={"flex flex-col gap-4"}>
							<h3 className="font-semibold text-xl text-left text-gray-400/50">Recent Activity</h3>
							{dashboardData === null
								? <LoadingBlock />
								:
								<Table
									isHeaderSticky
									removeWrapper
									aria-label="Recent transactions table"
									classNames={{
										th: "bg-gray-100/10 text-gray-600 font-bold text-xs uppercase",
										td: "py-4",
									}}
								>
									<TableHeader>
										<TableColumn>Date</TableColumn>
										<TableColumn>Description</TableColumn>
										<TableColumn>Status</TableColumn>
										<TableColumn align="end">Amount</TableColumn>
									</TableHeader>
									<TableBody
										emptyContent={
											<div>
												<p>You have not added any transactions to the system. </p>
												<Button>Add New Transaction</Button>
											</div>
										}
										items={recentTransactions}
									>
										{(transaction) => (
											<TableRow key={transaction.transaction_id}>
												<TableCell>
													<span className="text-gray-600">
														{moment(transaction.date).format("DD/MM/YYYY")}
													</span>
												</TableCell>
												<TableCell>
													<div className="font-medium">{transaction.description}</div>
												</TableCell>
												<TableCell>
													<Chip
														className="capitalize"
														color="success"
														size="sm"
														variant="flat"
													>
														Success
													</Chip>
												</TableCell>
												<TableCell>
													<span className={clsx("", {
														"text-success": transaction.direction === "in",
														"text-danger": transaction.direction === "out"
													})}>
														{transaction.direction === "in" ? "+ " : "- "}
														{transaction.amount.toLocaleString()}{SITE_CONFIG.CURRENCY_STRING}
													</span>
												</TableCell>
											</TableRow>
										)}
									</TableBody>
								</Table>
							}
						</CardBody>
					</Card>

					<Card>
						<CardBody className={"flex flex-col gap-6"}>
							<h3 className="font-semibold text-xl text-left text-gray-400/50">Upcoming Transactions</h3>
							{dashboardData === null
								? <LoadingBlock />
								: (
									<Table
										isHeaderSticky
										removeWrapper
										aria-label="Upcoming transactions table"
										classNames={{
											th: "bg-gray-100/10 text-gray-600 font-bold text-xs uppercase",
											td: "py-4",
										}}
									>
										<TableHeader>
											<TableColumn>Scheduled Date</TableColumn>
											<TableColumn>Name</TableColumn>
											<TableColumn>From Card</TableColumn>
											<TableColumn>Status</TableColumn>
											<TableColumn align="end">Amount</TableColumn>
										</TableHeader>
										<TableBody
											items={upcomingRecurrings?.instances.slice(0, 5) || []}
										>
											{(instance) => (
												<TableRow key={instance.instance_id}>
													<TableCell>
														<span className="text-gray-600">
															{moment(instance.scheduled_date).format("DD/MM/YYYY")}
														</span>
													</TableCell>
													<TableCell>
														<div className="font-medium">{instance.recurring_name || "Recurring"}</div>
													</TableCell>

													<TableCell>
														<span className="text-gray-600">{instance.card_name || "-"}</span>
													</TableCell>
													<TableCell>
														<Chip
															className="capitalize"
															color="warning"
															size="sm"
															variant="flat"
														>
															Pending
														</Chip>
													</TableCell>
													<TableCell>
														<span className={clsx("", {
															"text-success": instance.direction === "in",
															"text-danger": instance.direction === "out"
														})}>
															{instance.direction === "in" ? "+" : "- "}
															{instance.scheduled_amount.toLocaleString()}{SITE_CONFIG.CURRENCY_STRING}
														</span>
													</TableCell>
												</TableRow>
											)}
										</TableBody>
									</Table>
								)}
						</CardBody>
					</Card>
				</div>
			</div >

			{/* Category Details Modal */}
			<CategoryDetailsModal
				data={categoryBreakdown}
				isOpen={isOpenCategoryDetailsModal}
				onOpenChange={onCategoryDetailsModalChange}
			/>
		</Container >
	);
}
