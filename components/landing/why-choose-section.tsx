"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import "chart.js/auto";
import { Bar } from "react-chartjs-2";
import { Progress } from "@heroui/react";

import LandingSectionHeader from "./landing-section-header";

interface ChartData {
	month: string;
	value: number;
}

export default function WhyChooseSection() {
	const [chartData, setChartData] = useState<ChartData[]>([]);

	// detect project's primary color at runtime by measuring a hidden element with the `text-primary` class
	const [primaryColor, setPrimaryColor] = useState<string>("#0ea5a4");

	useEffect(() => {
		if (typeof window === "undefined") return;
		try {
			const el = document.createElement("span");

			el.className = "text-primary";
			el.style.position = "absolute";
			el.style.opacity = "0";
			el.style.pointerEvents = "none";
			document.body.appendChild(el);

			const cs = getComputedStyle(el).color || "";

			document.body.removeChild(el);

			if (cs) setPrimaryColor(cs.trim());
		} catch {
			// ignore and keep fallback
		}
	}, []);

	function toRgba(color: string, alpha = 1) {
		// color may be in form 'rgb(r,g,b)' or '#rrggbb'
		if (!color) return `rgba(14,165,164,${alpha})`;
		const c = color.trim();

		if (c.startsWith("rgb")) {
			// rgb or rgba
			const nums = c.replace(/rgba?\(|\)|\s/g, "").split(",").map((n) => Number(n));

			return `rgba(${nums[0]}, ${nums[1]}, ${nums[2]}, ${alpha})`;
		}
		if (c.startsWith("#")) {
			const hex = c.slice(1);

			const bigint = parseInt(
				hex.length === 3 ? hex.split("").map((s) => s + s).join("") : hex,
				16
			);

			const r = (bigint >> 16) & 255;
			const g = (bigint >> 8) & 255;
			const b = bigint & 255;

			return `rgba(${r}, ${g}, ${b}, ${alpha})`;
		}

		return `rgba(14,165,164,${alpha})`;
	}

	useEffect(() => {
		// Generate random data for 12 months
		const months = [
			"Jan", "Feb", "Mar", "Apr", "May", "Jun",
			"Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
		];

		const randomData = months.map((month) => ({
			month,
			value: Math.floor(Math.random() * 180) + 20 // Random value between 20-200
		}));

		setChartData(randomData);
	}, []);

	const fadeInUp = {
		initial: { opacity: 0, y: 60 },
		animate: { opacity: 1, y: 0 },
		transition: { duration: 0.6 }
	};

	const staggerContainer = {
		animate: {
			transition: {
				staggerChildren: 0.2
			}
		}
	};

    

	// Prepare Chart.js data and options (use detected primary color)
	const chartJsData = {
		labels: chartData.map((d) => d.month),
		datasets: [
			{
				label: "Monthly Expenses",
				data: chartData.map((d) => d.value * 100),
				backgroundColor: chartData.map((d) => (d.value > 120 ? primaryColor : toRgba(primaryColor, 0.22))),
				borderRadius: 6,
				barThickness: 18
			}
		]
	};

	const chartOptions: any = {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: { display: false }
		},
		scales: {
			x: { grid: { display: false } },
			y: { grid: { color: "rgba(0,0,0,0.05)" }, beginAtZero: true }
		}
	};

	return (
		<section className="w-full flex justify-center bg-white">
			<div className="max-w-7xl items-center flex flex-col gap-4">
				<LandingSectionHeader
					description="Simple tools and clear forecasts that help you plan, save, and avoid surprises."
					preTitle="Why people choose us"
					title="Simple, secure, and designed around your goals"
				/>

				<motion.div
					className="grid lg:grid-cols-2 gap-8 items-start"
					initial="initial"
					variants={staggerContainer}
					viewport={{ once: true }}
					whileInView="animate"
				>
					{/* Left card: Simplicity first */}
					<motion.div
						className="h-full flex flex-col gap-8 border-gray-200 border rounded-3xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300"
						variants={fadeInUp}
					>
						<div className="flex items-center gap-3">
							<h3 className="text-4xl font-bold text-dark leading-tight">Simplicity that gets you started</h3>
						</div>

						<div className="flex flex-col gap-4">
							<p className="text-gray-600 text-lg">Clean dashboards and quick setup—start tracking in minutes.</p>

							{/* Savings progress cards */}
							<div className="flex flex-col gap-4">
								<div className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 hover:shadow-md transition-shadow cursor-pointer">
									<div className="flex items-baseline justify-between">
										<span className="text-base font-medium text-gray-900">Emergency Fund</span>
										<span className="text-sm text-gray-600">Target: $5,000</span>
									</div>
									<div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-gray-200">
										<Progress value={75}  />
									</div>
								</div>

								{/* Card 2 */}
								<div className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 hover:shadow-md transition-shadow cursor-pointer">
									<div className="flex items-baseline justify-between">
										<span className="text-base font-medium text-gray-900">Vacation Jar</span>
										<span className="text-sm text-gray-600">Target: $2,000</span>
									</div>
									<div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-gray-200">
										<div
											aria-label="Vacation Jar progress"
											aria-valuemax={100}
											aria-valuemin={0}
											aria-valuenow={35}
											className="h-full rounded-full"
											role="progressbar"
											style={{ width: "35%", backgroundColor: primaryColor }}
										/>
									</div>
								</div>
							</div>
						</div>
					</motion.div>


					{/* Expenses Feature */}
					<motion.div
						className="h-full flex flex-col gap-8 border-gray-200 border rounded-3xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300"
						variants={fadeInUp}
					>
						<h3 className="text-4xl font-semibold text-gray-900 leading-tight max-w-md">
							Useful Expenses Reporting
						</h3>

						<div className="flex flex-col gap-4">
							<p className="text-gray-600 text-lg">Expenses Total - 2024</p>
							<p className="text-3xl font-semibold text-gray-900">
								$ {chartData.reduce((sum, data) => sum + data.value * 100, 0).toLocaleString()}.00
							</p>

							{/* 12-Month Expenses Chart (Chart.js) */}
							<div className="w-full h-48">
								<Bar data={chartJsData} options={chartOptions} />
							</div>
						</div>
					</motion.div>
				</motion.div>
			</div>
		</section>
	);
}