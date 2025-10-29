"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

import LandingSectionHeader from "./landing-section-header";

import { useLandingEndpoint } from "@/hooks/useLandingEndpoint";

interface StatisticCardProps {
	title: string;
	value: number;
	suffix?: string;
	icon: string;
}

function StatisticCard({ title, value, suffix = "", icon }: StatisticCardProps) {
	const [displayValue, setDisplayValue] = useState(0);

	useEffect(() => {
		let startTime: number | null = null;
		let animationFrame = 0;

		const animate = (timestamp: number) => {
			if (!startTime) startTime = timestamp;
			const progress = Math.min((timestamp - startTime) / 1600, 1); // 1.6s animation
			const easeOut = 1 - Math.pow(1 - progress, 3);
			const current = Math.floor(easeOut * value);

			setDisplayValue(current);
			if (progress < 1) animationFrame = requestAnimationFrame(animate);
		};

		const el = document.getElementById(`stat-${title.replace(/\s+/g, "-").toLowerCase()}`);

		if (el) {
			const observer = new IntersectionObserver((entries) => {
				if (entries[0].isIntersecting) {
					animationFrame = requestAnimationFrame(animate);
					observer.disconnect();
				}
			}, { threshold: 0.3 });

			observer.observe(el);

			return () => {
				if (animationFrame) cancelAnimationFrame(animationFrame);
				observer.disconnect();
			};
		}
	}, [value, title]);

	return (
		<motion.div
			className="min-w-max bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 text-center"
			id={`stat-${title.replace(/\s+/g, "-").toLowerCase()}`}
			initial={{ opacity: 0, y: 50 }}
			transition={{ duration: 0.6, ease: "easeOut" }}
			viewport={{ once: true }}
			whileInView={{ opacity: 1, y: 0 }}
		>
			<div className="text-4xl mb-4">{icon}</div>
			<div className="text-4xl lg:text-5xl font-bold text-primary mb-2">{displayValue.toLocaleString()}{suffix}</div>
			<div className="text-lg text-gray-600 font-semibold">{title}</div>
		</motion.div>
	);
}

export default function StatisticsSection() {
	const [stats, setStats] = useState({ total_users: 0, total_cards: 0, total_transactions: 0, total_recurrings: 0 });
	const { useGetStatistics } = useLandingEndpoint();

	const { data, loading, error } = useGetStatistics();

	useEffect(() => {
		if (data && data.results) {
			setStats({
				total_users: data.results.total_users,
				total_cards: data.results.total_cards,
				total_transactions: data.results.total_transactions,
				total_recurrings: 0 // Default value since API doesn't return this
			});
		}
	}, [data, error]);

	const statistics = [
		{ title: 'Total Users', value: stats.total_users, suffix: '', icon: '👥' },
		{ title: 'Bank Cards', value: stats.total_cards, suffix: '', icon: '💳' },
		{ title: 'Transactions', value: stats.total_transactions, suffix: '', icon: '💰' },
		{ title: 'Forecasts', value: stats.total_recurrings, suffix: '', icon: '📊' },
	];

	return (
		<section className="bg-gradient-to-b from-gray-50/10 via-primary-100 to-gray-50/10 py-20 relative">
			<div className="w-full flex flex-col gap-4">
				<LandingSectionHeader
					description="Join thousands who use CashLog to simplify tracking, insights, and planning."
					preTitle="Our Achievements"
					title="Built for real financial clarity"
				/>

				<div className="lg:px-16 md:px-8 px-4 grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
					{loading ? (
						<div className="col-span-4 text-center text-gray-500">Loading statistics…</div>
					) : (
						statistics.map((stat, index) => (
							<motion.div
								key={stat.title}
								initial={{ opacity: 0, y: 50 }}
								transition={{ duration: 0.6, delay: index * 0.2, ease: 'easeOut' }}
								viewport={{ once: true }}
								whileInView={{ opacity: 1, y: 0 }}
							>
								<StatisticCard icon={stat.icon} suffix={stat.suffix} title={stat.title} value={stat.value} />
							</motion.div>
						))
					)}
				</div>

				{/* Background decorative elements */}
				<div className="absolute inset-0 pointer-events-none overflow-hidden">
					<div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
					<div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
				</div>
			</div>
		</section>
	);
}
