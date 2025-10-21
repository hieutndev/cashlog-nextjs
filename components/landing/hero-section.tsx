"use client";

import { Button } from "@heroui/button";
import { Image } from "@heroui/image";
import { useRouter } from "next/navigation";

import { useAuth } from "../providers/auth-provider";

export default function HeroSection() {

	const router = useRouter();

	const { isLoggedIn } = useAuth();

	return (
		<section className="relative overflow-hidden bg-white">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
				<div className="grid lg:grid-cols-2 gap-12 items-center">
					<div className="w-full flex flex-col gap-4 lg:items-start items-center">
						<span className="text-primary font-semibold text-sm tracking-wide uppercase">
							Take control of your money
						</span>

						{/* Main Heading */}
						<h1 className="lg:text-left text-center text-6xl lg:text-7xl font-bold text-gray-900 !leading-tight">
							Track and manage your finances better
						</h1>

						{/* Subheading */}
						<p className="lg:text-left text-center text-xl text-gray-600 leading-relaxed max-w-2xl">
							Track income and expenses, automatically categorize transactions, and see clear forecasts so you always know what&apos;s coming. Fast setup, one unified view, real financial confidence.
						</p>

						{/* CTA Buttons */}
						<div className="flex items-center space-x-6">
							<Button
								color={"primary"}
								size={"lg"}
								variant={"shadow"}
								onPress={() => { isLoggedIn ? router.push('/dashboard') : router.push('/sign-up'); }}
							>
								Get started — it&apos;s free
							</Button>
						</div>
					</div>

					{/* Hero Illustration */}
					<div className="flex justify-center">
						<Image
							alt="Financial Dashboard Preview"
							className="w-auto max-h-128 scale-110"
							height={1200}
							src="/assets/landing/hero-mockup.png"
							width={1200}
						/>
					</div>
				</div>
			</div>

			{/* Floating bubbles decoration */}
			<div className="absolute inset-0 pointer-events-none">
				<div className="absolute top-20 left-20 w-20 h-20 bg-primary/10 rounded-full blur-sm" />
				<div className="absolute top-40 right-32 w-16 h-16 bg-primary/20 rounded-full blur-sm" />
				<div className="absolute bottom-40 left-32 w-24 h-24 bg-primary/15 rounded-full blur-sm" />
			</div>
		</section>
	);
}